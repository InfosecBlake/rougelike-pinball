import Matter from "matter-js";
import { PhysicsWorld } from "../physics/World";
import { Table } from "./Table";
import { Ball } from "../entities/Ball";
import { InputManager, InputAction } from "./Input";
import { SFX } from "./Audio";
import { Renderer } from "../render/Renderer";
import { UIManager } from "../ui/UI";
import { LEVELS } from "../levels";
import { LAUNCHER_BALL_START } from "../physics/TableShell";
import {
  BALLS_PER_GAME,
  BALL_SAVE_MS,
  SKILL_SHOT_WINDOW_MS,
  TILT_DECAY_PER_MS,
  NUDGE_TILT_ADD,
  STORAGE_KEYS,
  PHYSICS,
  CAT
} from "./constants";
import type { Vec2 } from "../levels/types";

export type GameState = "menu" | "serve" | "playing" | "level-complete" | "game-over" | "win" | "paused";

export interface Popup {
  text: string;
  x: number;
  y: number;
  born: number;
  color: string;
}

const COMBO_WINDOW_MS = 2200;
const EXTRA_BALL_STEP = 25000;
const LEVEL_CLEAR_BONUS = 5000;
const LEVEL_CELEBRATE_MS = 3200;
const MULTIBALL_ROLLOVER_TARGET = 3;

export class Game {
  physicsWorld = new PhysicsWorld();
  input: InputManager;
  sfx = new SFX();
  renderer: Renderer;
  ui: UIManager;

  levelIndex = 0;
  table: Table;
  balls: Ball[] = [];
  private ballsByBody = new Map<number, Ball>();

  state: GameState = "menu";
  private stateBeforePause: GameState = "menu";
  score = 0;
  highScore = 0;
  ballsRemaining = BALLS_PER_GAME;
  levelStartScore = 0;
  nextExtraBallScore = EXTRA_BALL_STEP;

  comboChain = 0;
  lastScoreAt = 0;
  tiltMeter = 0;
  tilted = false;
  ballSaveAvailable = false;
  ballSaveDeadline = 0;
  skillShotDeadline = 0;
  multiballProgress = 0;
  multiballReady = false;
  objectiveProgress = 0;
  levelCompleteAt = 0;
  shakeUntil = 0;

  popups: Popup[] = [];
  private pendingRelights: { id: string; at: number }[] = [];

  private rafId = 0;
  private lastTime = 0;
  private acc = 0;

  constructor(private canvas: HTMLCanvasElement, uiRoot: HTMLElement) {
    this.table = new Table(this.physicsWorld, LEVELS[this.levelIndex]);
    this.renderer = new Renderer(canvas);
    this.input = new InputManager(uiRoot);
    this.ui = new UIManager(uiRoot, {
      onStart: () => this.startGame(),
      onRestart: () => this.startGame(),
      onTogglePause: () => this.togglePause(),
      onMuteToggle: (muted) => (this.sfx.muted = muted)
    });
    this.ui.bindInput(this.input);
    this.highScore = Number(localStorage.getItem(STORAGE_KEYS.highScore) ?? 0);
    this.ui.showMenu(this.highScore);

    Matter.Events.on(this.physicsWorld.engine, "collisionStart", (e) => this.onCollision(e));
    this.input.onAction((action, pressed) => this.onInput(action, pressed));

    window.addEventListener("resize", () => this.renderer.resize());
    this.renderer.resize();
  }

  // ---------- lifecycle ----------

  start() {
    this.lastTime = performance.now();
    const loop = (t: number) => {
      this.rafId = requestAnimationFrame(loop);
      this.frame(t);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private frame(now: number) {
    let dt = now - this.lastTime;
    this.lastTime = now;
    if (dt > 250) dt = 250;
    this.acc += dt;

    if (this.state !== "menu" && this.state !== "paused" && this.state !== "game-over" && this.state !== "win") {
      const step = PHYSICS.fixedTimestepMs;
      let steps = 0;
      while (this.acc >= step && steps < 8) {
        this.fixedUpdate(step, now);
        this.acc -= step;
        steps++;
      }
    } else {
      this.acc = 0;
    }

    this.renderer.render(this, now);
    this.ui.update(this.hudData());
  }

  private startGame() {
    for (const b of [...this.balls]) this.removeBall(b);
    this.table.destroy();
    this.levelIndex = 0;
    this.table = new Table(this.physicsWorld, LEVELS[this.levelIndex]);
    this.score = 0;
    this.ballsRemaining = BALLS_PER_GAME;
    this.nextExtraBallScore = EXTRA_BALL_STEP;
    this.levelStartScore = 0;
    this.resetLevelTrackers();
    this.ui.hideMenu();
    this.ui.hideGameOver();
    this.sfx.resume();
    this.enterServe();
  }

  private resetLevelTrackers() {
    this.bumperHitSet.clear();
    this.dropClears = 0;
    this.multiballProgress = 0;
    this.multiballReady = false;
    this.pendingRelights = [];
    this.objectiveProgress = 0;
  }

  private bumperHitSet = new Set<string>();
  private dropClears = 0;

  private togglePause() {
    if (this.state === "paused") {
      this.state = this.stateBeforePause;
      this.ui.showPause(false);
    } else if (this.state === "serve" || this.state === "playing") {
      this.stateBeforePause = this.state;
      this.state = "paused";
      this.ui.showPause(true);
    }
  }

  // ---------- ball management ----------

  private spawnBall(pos: Vec2 = LAUNCHER_BALL_START): Ball {
    const ball = new Ball(pos.x, pos.y);
    this.physicsWorld.add(ball.body);
    this.balls.push(ball);
    this.ballsByBody.set(ball.body.id, ball);
    return ball;
  }

  private removeBall(ball: Ball) {
    this.physicsWorld.remove(ball.body);
    this.ballsByBody.delete(ball.body.id);
    this.balls = this.balls.filter((b) => b !== ball);
  }

  private enterServe() {
    this.state = "serve";
    this.tilted = false;
    this.tiltMeter = 0;
    this.comboChain = 0;
    this.skillShotDeadline = 0;
    this.ballSaveAvailable = true;
    this.ballSaveDeadline = 0;
    this.spawnBall();
  }

  // ---------- input ----------

  private onInput(action: InputAction, pressed: boolean) {
    if (action === "pause" && pressed) {
      this.togglePause();
      return;
    }
    if (this.state === "paused" || this.state === "menu" || this.state === "game-over" || this.state === "win") return;

    if (action === "left-flipper") {
      const p = this.tilted ? false : pressed;
      this.table.leftFlipper.setPressed(p);
      if (pressed && !this.tilted) this.sfx.flipper();
    } else if (action === "right-flipper") {
      const p = this.tilted ? false : pressed;
      this.table.rightFlipper.setPressed(p);
      if (pressed && !this.tilted) this.sfx.flipper();
    } else if (action === "launch" && this.state === "serve") {
      if (pressed) {
        this.sfx.resume();
        this.table.launcher.startCharge(performance.now());
      } else {
        this.releaseLauncher();
      }
    } else if ((action === "nudge-left" || action === "nudge-right" || action === "nudge-up") && pressed) {
      this.applyNudge(action);
    }
  }

  private releaseLauncher() {
    if (!this.table.launcher.charging) return;
    const now = performance.now();
    const velocity = this.table.launcher.release();
    const ball = this.balls[0];
    if (ball) {
      Matter.Body.setVelocity(ball.body, { x: (Math.random() - 0.5) * 0.6, y: -velocity });
    }
    this.state = "playing";
    this.ballSaveDeadline = now + BALL_SAVE_MS;
    this.skillShotDeadline = now + SKILL_SHOT_WINDOW_MS;
    this.sfx.launch();
  }

  private applyNudge(action: InputAction) {
    if (this.state !== "playing" && this.state !== "serve") return;
    const dir = action === "nudge-left" ? { x: 0.011, y: -0.006 } : action === "nudge-right" ? { x: -0.011, y: -0.006 } : { x: 0, y: -0.016 };
    for (const b of this.balls) {
      Matter.Body.applyForce(b.body, b.body.position, dir);
    }
    this.tiltMeter = Math.min(1, this.tiltMeter + NUDGE_TILT_ADD);
    this.shakeUntil = performance.now() + 220;
    if (this.tiltMeter >= 1 && !this.tilted) this.triggerTilt();
  }

  private triggerTilt() {
    this.tilted = true;
    this.tiltMeter = 1;
    this.table.leftFlipper.setPressed(false);
    this.table.rightFlipper.setPressed(false);
    this.comboChain = 0;
    this.sfx.tilt();
    this.addPopup("TREMOR!", this.table.def.bumpers[0]?.pos ?? { x: 260, y: 400 }, "#e63950");
  }

  // ---------- fixed update ----------

  private fixedUpdate(dt: number, now: number) {
    this.table.update(dt, now);
    this.physicsWorld.step(dt);
    this.updateCapturedBalls(dt);
    for (const b of this.balls) b.updateTrail();

    if (!this.tilted) {
      this.tiltMeter = Math.max(0, this.tiltMeter - TILT_DECAY_PER_MS * dt);
    }

    for (const pr of [...this.pendingRelights]) {
      if (now >= pr.at) {
        const r = this.table.rollovers.find((x) => x.id === pr.id);
        if (r) r.lit = true;
        this.pendingRelights = this.pendingRelights.filter((x) => x !== pr);
      }
    }

    if (this.state === "level-complete" && now - this.levelCompleteAt > LEVEL_CELEBRATE_MS) {
      this.advanceLevel();
    }

    this.popups = this.popups.filter((p) => now - p.born < 1100);
  }

  private updateCapturedBalls(dt: number) {
    for (const ball of this.balls) {
      if (!ball.captured) continue;
      const ramp = this.table.ramp;
      if (!ramp || ramp.id !== ball.captured.rampId) {
        ball.captured = null;
        continue;
      }
      ball.captured.t += dt / ball.captured.duration;
      if (ball.captured.t >= 1) {
        ball.body.collisionFilter.category = CAT.BALL;
        ball.body.isSensor = false;
        Matter.Body.setPosition(ball.body, ramp.def.exit);
        Matter.Body.setVelocity(ball.body, ramp.def.exitVelocity);
        ball.captured = null;
      } else {
        const pos = ramp.pointAt(ball.captured.t);
        Matter.Body.setPosition(ball.body, pos);
        Matter.Body.setVelocity(ball.body, { x: 0, y: 0 });
      }
    }
  }

  // ---------- collisions ----------

  private onCollision(event: Matter.IEventCollision<Matter.Engine>) {
    const now = performance.now();
    for (const pair of event.pairs) {
      const { bodyA, bodyB } = pair;
      let ballBody: Matter.Body | null = null;
      let other: Matter.Body | null = null;
      if (bodyA.label === "ball") {
        ballBody = bodyA;
        other = bodyB;
      } else if (bodyB.label === "ball") {
        ballBody = bodyB;
        other = bodyA;
      }
      if (!ballBody || !other) continue;
      const ball = this.ballsByBody.get(ballBody.id);
      if (!ball || ball.captured) continue;

      this.handleBallHit(ball, other, now);
    }
  }

  private handleBallHit(ball: Ball, other: Matter.Body, now: number) {
    const [kind, ...rest] = other.label.split(":");
    const id = rest.join(":");

    switch (kind) {
      case "bumper": {
        const bumper = this.table.bumpers.find((b) => b.id === id);
        if (!bumper) return;
        bumper.hit(ball.body);
        this.sfx.bumper();
        this.awardScore(bumper.score, bumper.body.position);
        this.bumperHitSet.add(id);
        if (this.multiballReady) this.triggerMultiball(now);
        this.checkObjective(now);
        break;
      }
      case "slingshot": {
        const s = this.table.slingshots.find((x) => x.id === id);
        if (!s) return;
        s.hit(ball.body);
        this.sfx.slingshot();
        this.awardScore(s.score, s.body.position);
        break;
      }
      case "target": {
        const [bankId, targetId] = rest;
        const bank = this.table.dropBank;
        if (!bank || bank.id !== bankId) return;
        const wasAllDropped = bank.allDropped;
        if (bank.drop(targetId)) {
          this.sfx.target();
          this.awardScore(bank.score, ball.position);
          if (!wasAllDropped && bank.allDropped) {
            this.dropClears++;
            this.awardScore(bank.bonus, ball.position);
            this.addPopup(`WALL SHATTERED +${bank.bonus}`, ball.position, "#ffd23f");
          }
          this.checkObjective(now);
        }
        break;
      }
      case "spinner": {
        const spinner = this.table.spinner;
        if (!spinner || spinner.id !== id) return;
        if (spinner.hit(now)) {
          this.sfx.spinner();
          this.awardScore(spinner.score, spinner.pos);
          this.checkObjective(now);
        }
        break;
      }
      case "rollover": {
        const rollover = this.table.rollovers.find((r) => r.id === id);
        if (!rollover || !rollover.lit) return;
        rollover.lit = false;
        rollover.flash = 1;
        this.sfx.rollover();
        let points = rollover.score;
        if (rollover.skillShot && this.skillShotDeadline > 0 && now <= this.skillShotDeadline) {
          points += 2000;
          this.addPopup("FIRST STRIKE!", rollover.body.position, "#ffcf5c");
          this.skillShotDeadline = 0;
        }
        this.awardScore(points, rollover.body.position);
        this.multiballProgress++;
        this.pendingRelights.push({ id: rollover.id, at: now + 3500 });
        if (this.multiballProgress >= MULTIBALL_ROLLOVER_TARGET && !this.multiballReady) {
          this.multiballReady = true;
          this.multiballProgress = 0;
          this.addPopup("HORDE READY", rollover.body.position, "#a86bff");
        }
        break;
      }
      case "ramp": {
        const ramp = this.table.ramp;
        if (!ramp || ramp.id !== id) return;
        if (!ramp.canTrigger(now, ball.speed)) return;
        ramp.trigger(now);
        ball.captured = { rampId: ramp.id, t: 0, duration: 650 };
        ball.body.isSensor = true;
        this.sfx.ramp();
        this.awardScore(ramp.def.score, ramp.def.entry);
        this.addPopup(ramp.def.label, ramp.def.entry, "#b969ff");
        this.checkObjective(now);
        break;
      }
      case "drain": {
        this.handleDrain(ball, now);
        break;
      }
    }
  }

  private triggerMultiball(now: number) {
    this.multiballReady = false;
    this.sfx.multiball();
    this.addPopup("HORDE UNLEASHED!", { x: 250, y: 260 }, "#ff5a3d");
    this.spawnBall({ x: 220, y: 210 });
    this.spawnBall({ x: 290, y: 210 });
    const b1 = this.balls[this.balls.length - 2];
    const b2 = this.balls[this.balls.length - 1];
    if (b1) Matter.Body.setVelocity(b1.body, { x: -1.5, y: 2 });
    if (b2) Matter.Body.setVelocity(b2.body, { x: 1.5, y: 2 });
    for (const r of this.table.rollovers) r.lit = true;
    this.pendingRelights = [];
  }

  private handleDrain(ball: Ball, now: number) {
    if (!ball.alive) return;
    ball.alive = false;
    this.removeBall(ball);
    this.sfx.drain();

    if (this.balls.length > 0) return; // other balls still in play (multiball)

    if (this.ballSaveAvailable && now <= this.ballSaveDeadline) {
      this.ballSaveAvailable = false;
      this.addPopup("SANCTUARY!", LAUNCHER_BALL_START, "#ffd23f");
      this.sfx.ballSave();
      this.state = "serve";
      this.tilted = false;
      this.tiltMeter = 0;
      this.skillShotDeadline = 0;
      this.spawnBall();
      return;
    }

    this.ballsRemaining--;
    if (this.ballsRemaining <= 0) {
      this.endGame(false);
    } else {
      this.enterServe();
    }
  }

  // ---------- scoring & objectives ----------

  awardScore(points: number, pos?: Vec2) {
    if (this.tilted) return;
    const now = performance.now();
    if (now - this.lastScoreAt <= COMBO_WINDOW_MS) this.comboChain++;
    else this.comboChain = 1;
    this.lastScoreAt = now;
    const multiplier = Math.min(4, 1 + Math.floor(Math.max(0, this.comboChain - 1) / 3) * 0.5);
    const total = Math.round(points * multiplier);
    this.score += total;
    if (pos) this.addPopup(`+${total}`, pos, multiplier > 1 ? "#ffd23f" : "#ffffff");

    if (this.score >= this.nextExtraBallScore) {
      this.ballsRemaining++;
      this.nextExtraBallScore += EXTRA_BALL_STEP;
      this.sfx.extraBall();
      this.addPopup("BONUS LIFE!", pos ?? { x: 250, y: 300 }, "#8ee666");
    }
  }

  get comboMultiplier() {
    return Math.min(4, 1 + Math.floor(Math.max(0, this.comboChain - 1) / 3) * 0.5);
  }

  private checkObjective(now: number) {
    if (this.state === "level-complete" || this.state === "win") return;
    const obj = this.table.def.objective;
    let progress = 0;
    switch (obj.type) {
      case "light-bumpers":
        progress = this.bumperHitSet.size;
        break;
      case "clear-drop-targets":
        progress = this.dropClears;
        break;
      case "spin-spinner":
        progress = this.table.spinner?.spins ?? 0;
        break;
      case "run-ramp":
        progress = this.table.ramp?.runs ?? 0;
        break;
      case "grand-finale":
        progress = this.score - this.levelStartScore;
        break;
    }
    this.objectiveProgress = Math.min(progress, obj.target);
    if (progress >= obj.target) this.completeLevel(now);
  }

  private completeLevel(now: number) {
    this.state = "level-complete";
    this.levelCompleteAt = now;
    this.sfx.levelComplete();
    this.score += LEVEL_CLEAR_BONUS;
    this.addPopup(`CHAMBER CLEARED +${LEVEL_CLEAR_BONUS}`, { x: 250, y: 300 }, "#ffd23f");
  }

  private advanceLevel() {
    for (const b of [...this.balls]) this.removeBall(b);
    if (this.levelIndex + 1 >= LEVELS.length) {
      this.endGame(true);
      return;
    }
    this.table.destroy();
    this.levelIndex++;
    this.table = new Table(this.physicsWorld, LEVELS[this.levelIndex]);
    this.levelStartScore = this.score;
    this.resetLevelTrackers();
    this.enterServe();
  }

  private endGame(won: boolean) {
    this.state = won ? "win" : "game-over";
    for (const b of [...this.balls]) this.removeBall(b);
    const isNew = this.score > this.highScore;
    if (isNew) {
      this.highScore = this.score;
      localStorage.setItem(STORAGE_KEYS.highScore, String(this.highScore));
    }
    if (won) this.sfx.levelComplete();
    else this.sfx.gameOver();
    this.ui.showGameOver(won, this.score, this.highScore, isNew);
  }

  addPopup(text: string, pos: Vec2, color: string) {
    this.popups.push({ text, x: pos.x, y: pos.y, born: performance.now(), color });
  }

  private hudData() {
    const obj = this.table.def.objective;
    return {
      score: this.score,
      highScore: this.highScore,
      level: this.levelIndex + 1,
      levelCount: LEVELS.length,
      levelTitle: this.table.def.title,
      levelSubtitle: this.table.def.subtitle,
      objectiveLabel: obj.label,
      objectiveProgress: this.objectiveProgress,
      objectiveTarget: obj.target,
      ballsRemaining: this.ballsRemaining,
      comboMultiplier: this.comboMultiplier,
      tiltMeter: this.tiltMeter,
      tilted: this.tilted,
      skillShotActive: this.skillShotDeadline > 0 && performance.now() <= this.skillShotDeadline,
      multiballReady: this.multiballReady,
      state: this.state
    };
  }
}
