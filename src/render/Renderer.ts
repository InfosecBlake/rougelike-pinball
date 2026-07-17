import type { Game } from "../core/Game";
import { TABLE_WIDTH, TABLE_HEIGHT, BALL_RADIUS } from "../core/constants";
import {
  outerBoundary,
  laneDivider,
  laneFloor,
  rightOutlaneGuide,
  leftInlaneGuide,
  LAUNCHER_LANE_X
} from "../physics/TableShell";
import type { Vec2 } from "../levels/types";

function poly(ctx: CanvasRenderingContext2D, pts: Vec2[]) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private dpr = Math.min(window.devicePixelRatio || 1, 2);
  private stars: { x: number; y: number; r: number; tw: number }[] = [];

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    for (let i = 0; i < 90; i++) {
      this.stars.push({
        x: Math.random() * TABLE_WIDTH,
        y: Math.random() * TABLE_HEIGHT,
        r: Math.random() * 1.4 + 0.3,
        tw: Math.random() * Math.PI * 2
      });
    }
  }

  resize() {
    const parent = this.canvas.parentElement!;
    const availW = parent.clientWidth;
    const availH = parent.clientHeight;
    const scale = Math.min(availW / TABLE_WIDTH, availH / TABLE_HEIGHT);
    const cssW = TABLE_WIDTH * scale;
    const cssH = TABLE_HEIGHT * scale;
    this.canvas.style.width = `${cssW}px`;
    this.canvas.style.height = `${cssH}px`;
    this.canvas.width = Math.round(cssW * this.dpr);
    this.canvas.height = Math.round(cssH * this.dpr);
    this.ctx.setTransform(this.dpr * scale, 0, 0, this.dpr * scale, 0, 0);
  }

  render(game: Game, now: number) {
    const ctx = this.ctx;
    const theme = game.table.def.theme;
    ctx.save();

    if (now < game.shakeUntil) {
      const s = (game.shakeUntil - now) / 220;
      ctx.translate((Math.random() - 0.5) * 6 * s, (Math.random() - 0.5) * 6 * s);
    }

    this.drawBackground(theme, now);
    this.drawWalls(theme);
    this.drawLauncher(game, theme);
    this.drawDropTargets(game, theme);
    this.drawRamp(game, theme);
    this.drawSpinner(game, theme);
    this.drawRollovers(game, theme, now);
    this.drawSlingshots(game);
    this.drawBumpers(game, theme);
    this.drawFlipper(game.table.leftFlipper, theme);
    this.drawFlipper(game.table.rightFlipper, theme);
    this.drawBalls(game);
    this.drawPopups(game, now);
    this.drawVignette();

    ctx.restore();
  }

  private drawBackground(theme: Game["table"]["def"]["theme"], now: number) {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(0, 0, 0, TABLE_HEIGHT);
    g.addColorStop(0, theme.playfieldAccent);
    g.addColorStop(1, theme.playfield);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

    if (theme.starfield) {
      for (const s of this.stars) {
        const tw = 0.5 + 0.5 * Math.sin(now / 600 + s.tw);
        ctx.globalAlpha = 0.15 + tw * 0.5;
        ctx.fillStyle = theme.accentB;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // center grid glow for depth
    const radial = ctx.createRadialGradient(TABLE_WIDTH / 2, TABLE_HEIGHT * 0.4, 20, TABLE_WIDTH / 2, TABLE_HEIGHT * 0.4, TABLE_HEIGHT * 0.7);
    radial.addColorStop(0, theme.glow + "18");
    radial.addColorStop(1, "transparent");
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
  }

  private glowStroke(pts: Vec2[], color: string, width: number, blur: number) {
    const ctx = this.ctx;
    poly(ctx, pts);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  private drawWalls(theme: Game["table"]["def"]["theme"]) {
    const rail = theme.rail;
    this.glowStroke(outerBoundary(), rail, 10, 14);
    this.glowStroke(outerBoundary(), theme.glow, 2, 6);
    this.glowStroke(laneDivider(), rail, 8, 10);
    this.glowStroke(laneFloor(), rail, 8, 8);
    this.glowStroke(rightOutlaneGuide(), rail, 7, 8);
    this.glowStroke(leftInlaneGuide(), rail, 6, 6);
  }

  private drawLauncher(game: Game, theme: Game["table"]["def"]["theme"]) {
    const ctx = this.ctx;
    const l = game.table.launcher;
    const baseY = l.restY + 34;
    const pull = l.charge * 26;
    ctx.save();
    ctx.strokeStyle = theme.accentA;
    ctx.lineWidth = 4;
    ctx.shadowColor = theme.accentA;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const y = baseY - i * 7;
      ctx.moveTo(LAUNCHER_LANE_X - 6, y);
      ctx.lineTo(LAUNCHER_LANE_X + 6, y - 3);
    }
    ctx.stroke();
    ctx.restore();
    if (l.charging) {
      ctx.save();
      ctx.fillStyle = theme.accentB;
      ctx.fillRect(LAUNCHER_LANE_X - 4, baseY + 10, 8, -pull);
      ctx.restore();
    }
  }

  private drawBumpers(game: Game, theme: Game["table"]["def"]["theme"]) {
    const ctx = this.ctx;
    for (const b of game.table.bumpers) {
      const r = (b.body as any).circleRadius ?? 24;
      const pos = b.body.position;
      const glow = 10 + b.flash * 22;
      ctx.save();
      ctx.shadowColor = theme.accentA;
      ctx.shadowBlur = glow;
      const grad = ctx.createRadialGradient(pos.x, pos.y, r * 0.1, pos.x, pos.y, r);
      grad.addColorStop(0, b.flash > 0 ? "#ffffff" : "#241a10");
      grad.addColorStop(1, b.lit ? theme.accentA : "#241a10");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = theme.accentA;
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawSlingshots(game: Game) {
    const ctx = this.ctx;
    for (const s of game.table.slingshots) {
      const verts = (s.body.vertices ?? []) as Vec2[];
      if (!verts.length) continue;
      ctx.save();
      poly(ctx, verts);
      ctx.closePath();
      ctx.fillStyle = s.flash > 0 ? "#ffffff" : "#e63950";
      ctx.shadowColor = "#e63950";
      ctx.shadowBlur = 8 + s.flash * 20;
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.restore();
    }
  }

  private drawSpinner(game: Game, theme: Game["table"]["def"]["theme"]) {
    const spinner = game.table.spinner;
    if (!spinner) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(spinner.pos.x, spinner.pos.y);
    ctx.rotate(spinner.angle + Math.sin(spinner.spinAngle) * 1.4);
    ctx.strokeStyle = theme.accentA;
    ctx.shadowColor = theme.accentA;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-spinner.length / 2, 0);
    ctx.lineTo(spinner.length / 2, 0);
    ctx.stroke();
    ctx.restore();
  }

  private drawDropTargets(game: Game, theme: Game["table"]["def"]["theme"]) {
    const bank = game.table.dropBank;
    if (!bank) return;
    const ctx = this.ctx;
    for (const t of bank.targets) {
      if (t.dropped) continue;
      ctx.save();
      ctx.translate(t.pos.x, t.pos.y);
      ctx.rotate(t.angle);
      ctx.fillStyle = theme.accentA;
      ctx.shadowColor = theme.accentA;
      ctx.shadowBlur = 10;
      ctx.fillRect(-t.width / 2, -t.height / 2, t.width, t.height);
      ctx.restore();
    }
  }

  private drawRamp(game: Game, theme: Game["table"]["def"]["theme"]) {
    const ramp = game.table.ramp;
    if (!ramp) return;
    const ctx = this.ctx;
    const pts: Vec2[] = [];
    for (let i = 0; i <= 24; i++) pts.push(ramp.pointAt(i / 24));
    this.glowStroke(pts, theme.accentC, 6, 6 + ramp.flash * 16);
    ctx.save();
    ctx.beginPath();
    ctx.arc(ramp.def.entry.x, ramp.def.entry.y, ramp.def.entryRadius ?? 20, 0, Math.PI * 2);
    ctx.strokeStyle = theme.accentC;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  private drawRollovers(game: Game, theme: Game["table"]["def"]["theme"], now: number) {
    const ctx = this.ctx;
    const skillActive = game.skillShotDeadline > 0 && now <= game.skillShotDeadline;
    for (const r of game.table.rollovers) {
      ctx.save();
      const isSkillLit = r.skillShot && skillActive && r.lit;
      ctx.fillStyle = r.lit ? (isSkillLit ? "#ffd23f" : theme.accentB) : "#33395a";
      ctx.shadowColor = ctx.fillStyle as string;
      ctx.shadowBlur = r.lit ? 12 + r.flash * 16 : 2;
      ctx.beginPath();
      ctx.arc(r.body.position.x, r.body.position.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawFlipper(flipper: Game["table"]["leftFlipper"], theme: Game["table"]["def"]["theme"]) {
    const ctx = this.ctx;
    const b = flipper.body;
    ctx.save();
    ctx.translate(b.position.x, b.position.y);
    ctx.rotate(b.angle);
    const len = flipper.length;
    ctx.fillStyle = theme.accentA;
    ctx.shadowColor = theme.accentA;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(-len / 2, -10, len, 20, 10);
    ctx.fill();
    ctx.restore();
  }

  private drawBalls(game: Game) {
    const ctx = this.ctx;
    for (const ball of game.balls) {
      for (let i = ball.trail.length - 1; i >= 0; i--) {
        const p = ball.trail[i];
        const alpha = (1 - i / ball.trail.length) * 0.25;
        ctx.beginPath();
        ctx.fillStyle = `rgba(180,220,255,${alpha})`;
        ctx.arc(p.x, p.y, BALL_RADIUS * (1 - i / ball.trail.length) * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
      const pos = ball.body.position;
      const grad = ctx.createRadialGradient(pos.x - 3, pos.y - 3, 1, pos.x, pos.y, BALL_RADIUS);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.5, "#cfe3ff");
      grad.addColorStop(1, "#6c86b8");
      ctx.save();
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 8;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawPopups(game: Game, now: number) {
    const ctx = this.ctx;
    for (const p of game.popups) {
      const age = now - p.born;
      const t = age / 1100;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - t);
      ctx.fillStyle = p.color;
      ctx.font = "bold 15px 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fillText(p.text, p.x, p.y - t * 34);
      ctx.restore();
    }
  }

  private drawVignette() {
    const ctx = this.ctx;
    const g = ctx.createRadialGradient(
      TABLE_WIDTH / 2,
      TABLE_HEIGHT / 2,
      TABLE_HEIGHT * 0.35,
      TABLE_WIDTH / 2,
      TABLE_HEIGHT / 2,
      TABLE_HEIGHT * 0.75
    );
    g.addColorStop(0, "transparent");
    g.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
  }
}
