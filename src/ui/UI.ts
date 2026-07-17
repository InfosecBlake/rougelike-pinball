import type { InputManager } from "../core/Input";

export interface HudData {
  score: number;
  highScore: number;
  level: number;
  levelCount: number;
  levelTitle: string;
  levelSubtitle: string;
  objectiveLabel: string;
  objectiveProgress: number;
  objectiveTarget: number;
  ballsRemaining: number;
  comboMultiplier: number;
  tiltMeter: number;
  tilted: boolean;
  skillShotActive: boolean;
  multiballReady: boolean;
  state: string;
}

export interface UIManagerCallbacks {
  onStart(): void;
  onRestart(): void;
  onTogglePause(): void;
  onMuteToggle(muted: boolean): void;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, html?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

export class UIManager {
  private root: HTMLElement;
  private hud: HTMLElement;
  private scoreEl: HTMLElement;
  private highScoreEl: HTMLElement;
  private levelEl: HTMLElement;
  private objectiveLabelEl: HTMLElement;
  private objectiveBarFill: HTMLElement;
  private ballsEl: HTMLElement;
  private comboEl: HTMLElement;
  private tiltFill: HTMLElement;
  private skillChip: HTMLElement;
  private multiballChip: HTMLElement;

  private menuScreen: HTMLElement;
  private menuHighScore: HTMLElement;
  private gameOverScreen: HTMLElement;
  private gameOverTitle: HTMLElement;
  private gameOverScore: HTMLElement;
  private pauseScreen: HTMLElement;
  private muted = false;

  constructor(root: HTMLElement, private cb: UIManagerCallbacks) {
    this.root = root;

    this.hud = el("div", "hud");
    this.hud.innerHTML = `
      <div class="hud-top">
        <div class="hud-block">
          <div class="hud-label">SCORE</div>
          <div class="hud-score" id="score">0</div>
        </div>
        <div class="hud-block hud-block-right">
          <div class="hud-label">BEST</div>
          <div class="hud-highscore" id="highscore">0</div>
        </div>
      </div>
      <div class="hud-mid">
        <div class="hud-level" id="level">LEVEL 1</div>
        <div class="hud-objective">
          <span id="objective-label">—</span>
          <div class="objective-bar"><div class="objective-bar-fill" id="objective-fill"></div></div>
        </div>
      </div>
      <div class="hud-chips">
        <div class="chip chip-skill" id="chip-skill">SKILL SHOT</div>
        <div class="chip chip-multiball" id="chip-multiball">MULTIBALL READY</div>
      </div>
      <div class="hud-bottom">
        <div class="hud-balls" id="balls"></div>
        <div class="hud-combo" id="combo">x1</div>
        <div class="tilt-meter"><div class="tilt-fill" id="tilt-fill"></div><span>TILT</span></div>
      </div>
    `;
    root.appendChild(this.hud);

    this.scoreEl = this.hud.querySelector("#score")!;
    this.highScoreEl = this.hud.querySelector("#highscore")!;
    this.levelEl = this.hud.querySelector("#level")!;
    this.objectiveLabelEl = this.hud.querySelector("#objective-label")!;
    this.objectiveBarFill = this.hud.querySelector("#objective-fill")!;
    this.ballsEl = this.hud.querySelector("#balls")!;
    this.comboEl = this.hud.querySelector("#combo")!;
    this.tiltFill = this.hud.querySelector("#tilt-fill")!;
    this.skillChip = this.hud.querySelector("#chip-skill")!;
    this.multiballChip = this.hud.querySelector("#chip-multiball")!;

    // --- Menu ---
    this.menuScreen = el(
      "div",
      "screen menu-screen",
      `
      <div class="screen-card">
        <h1 class="logo">NEON<span>CASCADE</span></h1>
        <p class="tagline">A sleek 5-table pinball run</p>
        <div class="menu-highscore">BEST <b id="menu-highscore">0</b></div>
        <button class="btn btn-primary" id="btn-start">START GAME</button>
        <div class="howto">
          <div><b>&larr; / Z</b> left flipper &nbsp; <b>&rarr; / X</b> right flipper</div>
          <div><b>Hold Space</b> to charge launch, release to fire</div>
          <div><b>A / D / W</b> nudge the table &mdash; too much and you'll tilt</div>
        </div>
        <button class="btn btn-ghost" id="btn-mute">🔊 SOUND ON</button>
      </div>
    `
    );
    root.appendChild(this.menuScreen);
    this.menuHighScore = this.menuScreen.querySelector("#menu-highscore")!;
    this.menuScreen.querySelector("#btn-start")!.addEventListener("click", () => this.cb.onStart());
    const muteBtn = this.menuScreen.querySelector("#btn-mute")! as HTMLButtonElement;
    muteBtn.addEventListener("click", () => {
      this.muted = !this.muted;
      muteBtn.textContent = this.muted ? "🔇 SOUND OFF" : "🔊 SOUND ON";
      this.cb.onMuteToggle(this.muted);
    });

    // --- Game over / win ---
    this.gameOverScreen = el(
      "div",
      "screen gameover-screen hidden",
      `
      <div class="screen-card">
        <h1 class="logo" id="gameover-title">GAME OVER</h1>
        <div class="final-score" id="gameover-score">0</div>
        <button class="btn btn-primary" id="btn-restart">PLAY AGAIN</button>
      </div>
    `
    );
    root.appendChild(this.gameOverScreen);
    this.gameOverTitle = this.gameOverScreen.querySelector("#gameover-title")!;
    this.gameOverScore = this.gameOverScreen.querySelector("#gameover-score")!;
    this.gameOverScreen.querySelector("#btn-restart")!.addEventListener("click", () => this.cb.onRestart());

    // --- Pause ---
    this.pauseScreen = el("div", "screen pause-screen hidden", `<div class="screen-card"><h1 class="logo">PAUSED</h1><p class="tagline">Press P or Esc to resume</p></div>`);
    root.appendChild(this.pauseScreen);

    // --- Touch controls ---
    const touch = el(
      "div",
      "touch-controls",
      `
      <div class="touch-btn touch-left" id="touch-left">◀</div>
      <div class="touch-btn touch-nudge" id="touch-nudge">✦</div>
      <div class="touch-btn touch-launch" id="touch-launch">HOLD</div>
      <div class="touch-btn touch-right" id="touch-right">▶</div>
    `
    );
    root.appendChild(touch);
    this.touchLeft = touch.querySelector("#touch-left")!;
    this.touchRight = touch.querySelector("#touch-right")!;
    this.touchLaunch = touch.querySelector("#touch-launch")!;
    this.touchNudge = touch.querySelector("#touch-nudge")!;

    const pauseBtn = el("button", "pause-btn", "⏸");
    pauseBtn.addEventListener("click", () => this.cb.onTogglePause());
    root.appendChild(pauseBtn);
  }

  private touchLeft!: HTMLElement;
  private touchRight!: HTMLElement;
  private touchLaunch!: HTMLElement;
  private touchNudge!: HTMLElement;

  bindInput(input: InputManager) {
    input.bindTouchButton(this.touchLeft, "left-flipper");
    input.bindTouchButton(this.touchRight, "right-flipper");
    input.bindTouchButton(this.touchLaunch, "launch");
    input.bindTouchButton(this.touchNudge, "nudge-up");
  }

  showMenu(highScore: number) {
    this.menuHighScore.textContent = highScore.toLocaleString();
    this.menuScreen.classList.remove("hidden");
  }
  hideMenu() {
    this.menuScreen.classList.add("hidden");
  }

  showGameOver(win: boolean, score: number, highScore: number, isNew: boolean) {
    this.gameOverTitle.textContent = win ? "CORE OVERLOADED" : "GAME OVER";
    this.gameOverScore.innerHTML = `${score.toLocaleString()}${isNew ? '<div class="new-best">NEW BEST!</div>' : ""}<div class="hud-label">BEST ${highScore.toLocaleString()}</div>`;
    this.gameOverScreen.classList.remove("hidden");
  }
  hideGameOver() {
    this.gameOverScreen.classList.add("hidden");
  }

  showPause(show: boolean) {
    this.pauseScreen.classList.toggle("hidden", !show);
  }

  update(d: HudData) {
    this.scoreEl.textContent = d.score.toLocaleString();
    this.highScoreEl.textContent = d.highScore.toLocaleString();
    this.levelEl.textContent = `LEVEL ${d.level} / ${d.levelCount} — ${d.levelTitle}`;
    this.objectiveLabelEl.textContent = `${d.objectiveLabel} (${d.objectiveProgress}/${d.objectiveTarget})`;
    const pct = d.objectiveTarget > 0 ? Math.min(100, (d.objectiveProgress / d.objectiveTarget) * 100) : 0;
    this.objectiveBarFill.style.width = `${pct}%`;

    this.ballsEl.innerHTML = Array.from({ length: d.ballsRemaining })
      .map(() => `<span class="ball-dot"></span>`)
      .join("");

    this.comboEl.textContent = `x${d.comboMultiplier}`;
    this.comboEl.classList.toggle("combo-hot", d.comboMultiplier > 1);

    this.tiltFill.style.width = `${d.tiltMeter * 100}%`;
    this.tiltFill.classList.toggle("tilt-danger", d.tilted || d.tiltMeter > 0.72);

    this.skillChip.classList.toggle("chip-active", d.skillShotActive);
    this.multiballChip.classList.toggle("chip-active", d.multiballReady);
  }
}
