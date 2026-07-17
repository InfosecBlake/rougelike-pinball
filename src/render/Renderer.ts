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
import {
  buildBrickTile,
  buildDetailOverlay,
  makeDripEmitters,
  drawWaterDrip,
  drawDampTrail,
  drawPuddle,
  drawPixelDisc,
  drawPixelGrid,
  hashString,
  shade,
  px,
  type DripEmitter
} from "./PixelArt";

type Theme = Game["table"]["def"]["theme"];

function poly(ctx: CanvasRenderingContext2D, pts: Vec2[]) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
}

const FLAME_A = [".y..", "yoy.", "yory", ".oy."];
const FLAME_B = [".o..", "yoy.", "yory", ".ry."];
const FLAME_PALETTE: Record<string, string> = { y: "#fff2a8", o: "#ff9c2e", r: "#e6392f" };

const DRIP_POINTS: { x: number; topY: number; bottomY: number }[] = [
  { x: 128, topY: 24, bottomY: 128 },
  { x: 372, topY: 30, bottomY: 140 },
  { x: 480, topY: 140, bottomY: 250 },
  { x: 250, topY: 18, bottomY: 118 }
];

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private dpr = Math.min(window.devicePixelRatio || 1, 2);

  private cachedThemeName = "";
  private brickPattern: CanvasPattern | null = null;
  private detailOverlay: HTMLCanvasElement | null = null;
  private drips: DripEmitter[] = [];

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
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
    this.ctx.imageSmoothingEnabled = false;
  }

  private ensureTheme(theme: Theme) {
    if (theme.name === this.cachedThemeName) return;
    this.cachedThemeName = theme.name;
    const seed = hashString(theme.name);
    const brickBase = shade(theme.rail, -0.12);
    const mortar = shade(theme.playfield, -0.35);
    const tile = buildBrickTile(brickBase, mortar, seed);
    this.brickPattern = this.ctx.createPattern(tile, "repeat");
    this.detailOverlay = buildDetailOverlay(TABLE_WIDTH, TABLE_HEIGHT, "#4f7a2e", "#33511e", "#0a0705", seed + 7);
    this.drips = makeDripEmitters(DRIP_POINTS, seed + 13);
  }

  render(game: Game, now: number) {
    const ctx = this.ctx;
    const theme = game.table.def.theme;
    this.ensureTheme(theme);
    ctx.save();

    if (now < game.shakeUntil) {
      const s = (game.shakeUntil - now) / 220;
      ctx.translate((Math.random() - 0.5) * 6 * s, (Math.random() - 0.5) * 6 * s);
    }

    this.drawBackground(theme);
    this.drawWaterDrips(now);
    this.drawWalls(theme);
    this.drawLauncher(game, theme);
    this.drawDropTargets(game, theme);
    this.drawRamp(game, theme);
    this.drawSpinner(game, theme);
    this.drawRollovers(game, theme, now);
    this.drawSlingshots(game);
    this.drawBumpers(game, now);
    this.drawFlipper(game.table.leftFlipper, theme);
    this.drawFlipper(game.table.rightFlipper, theme);
    this.drawBalls(game);
    this.drawPopups(game, now);
    this.drawVignette();

    ctx.restore();
  }

  private drawBackground(theme: Theme) {
    const ctx = this.ctx;
    if (this.brickPattern) {
      ctx.fillStyle = this.brickPattern;
      ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
    } else {
      ctx.fillStyle = theme.playfield;
      ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
    }

    // Depth gradient: darker toward the bottom, so the chamber reads as a pit.
    const g = ctx.createLinearGradient(0, 0, 0, TABLE_HEIGHT);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, shade(theme.playfield, -0.4) + "aa");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

    // Theme tint over the shared brick base so each chamber still reads distinctly.
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = theme.playfieldAccent;
    ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
    ctx.globalAlpha = 1;

    if (this.detailOverlay) {
      ctx.drawImage(this.detailOverlay, 0, 0);
    }

    if (theme.starfield) {
      // repurposed as drifting dust/spore motes for the dungeon atmosphere
      const rng = (i: number) => {
        const x = Math.sin(i * 12.9898) * 43758.5453;
        return x - Math.floor(x);
      };
      for (let i = 0; i < 40; i++) {
        const x = rng(i) * TABLE_WIDTH;
        const y = rng(i + 99) * TABLE_HEIGHT;
        ctx.globalAlpha = 0.1 + rng(i + 5) * 0.15;
        ctx.fillStyle = theme.accentB;
        ctx.fillRect(px(x, 2), px(y, 2), 2, 2);
      }
      ctx.globalAlpha = 1;
    }
  }

  private drawWaterDrips(now: number) {
    const ctx = this.ctx;
    for (const e of this.drips) {
      drawDampTrail(ctx, e);
      drawPuddle(ctx, e.x, e.bottomY, 9);
      drawWaterDrip(ctx, e, now);
    }
  }

  private stoneStroke(pts: Vec2[], color: string, width: number) {
    const ctx = this.ctx;
    ctx.lineJoin = "miter";
    ctx.lineCap = "square";
    poly(ctx, pts);
    ctx.strokeStyle = shade(color, -0.4);
    ctx.lineWidth = width + 3;
    ctx.stroke();
    poly(ctx, pts);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    poly(ctx, pts);
    ctx.strokeStyle = shade(color, 0.25);
    ctx.lineWidth = Math.max(1, width - 5);
    ctx.stroke();
  }

  private drawWalls(theme: Theme) {
    const rail = theme.rail;
    this.stoneStroke(outerBoundary(), rail, 12);
    this.stoneStroke(laneDivider(), rail, 9);
    this.stoneStroke(laneFloor(), rail, 10);
    this.stoneStroke(rightOutlaneGuide(), rail, 8);
    this.stoneStroke(leftInlaneGuide(), rail, 7);

    // faint torchlight rim along the top arc only
    const ctx = this.ctx;
    ctx.save();
    ctx.shadowColor = theme.glow;
    ctx.shadowBlur = 8;
    poly(ctx, outerBoundary());
    ctx.strokeStyle = theme.glow + "55";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  private drawLauncher(game: Game, theme: Theme) {
    const ctx = this.ctx;
    const l = game.table.launcher;
    const baseY = l.restY + 34;
    const pull = l.charge * 26;
    ctx.save();
    ctx.strokeStyle = shade(theme.rail, 0.3);
    ctx.lineWidth = 4;
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
      ctx.fillStyle = theme.accentA;
      ctx.fillRect(LAUNCHER_LANE_X - 4, baseY + 10, 8, -pull);
      ctx.restore();
    }
  }

  private drawBumpers(game: Game, now: number) {
    const ctx = this.ctx;
    for (const b of game.table.bumpers) {
      const r = (b.body as any).circleRadius ?? 24;
      const pos = b.body.position;
      const jitter = hashString(b.id) % 100;

      // stone sconce base
      drawPixelDisc(ctx, pos.x, pos.y, r, b.flash > 0 ? "#e8dcc8" : "#4a4038", 10, "#1c1710");

      if (b.lit || b.flash > 0) {
        ctx.save();
        ctx.translate(pos.x, pos.y - r * 0.55);
        const flicker = Math.sin(now / 90 + jitter) > 0;
        const unit = Math.max(2, Math.round(r / 4));
        ctx.shadowColor = "#ff9c2e";
        ctx.shadowBlur = 6 + b.flash * 14;
        drawPixelGrid(ctx, flicker ? FLAME_A : FLAME_B, FLAME_PALETTE, unit);
        ctx.restore();
      } else {
        // cold, unlit ember
        ctx.save();
        ctx.fillStyle = "#3a2418";
        ctx.fillRect(px(pos.x - 2, 2), px(pos.y - r * 0.5, 2), 4, 3);
        ctx.restore();
      }
    }
  }

  private drawSlingshots(game: Game) {
    const ctx = this.ctx;
    for (const s of game.table.slingshots) {
      const verts = (s.body.vertices ?? []) as Vec2[];
      if (!verts.length) continue;
      const hit = s.flash > 0;
      ctx.save();
      poly(ctx, verts);
      ctx.closePath();
      ctx.fillStyle = hit ? "#ffffff" : "#7a1620";
      ctx.fill();
      // jagged spike teeth along the top edge
      const [a, b] = verts;
      const steps = 5;
      ctx.fillStyle = hit ? "#ffe0e0" : "#c73a45";
      for (let i = 0; i < steps; i++) {
        const t0 = i / steps;
        const t1 = (i + 0.5) / steps;
        const x0 = a.x + (b.x - a.x) * t0;
        const y0 = a.y + (b.y - a.y) * t0;
        const xm = a.x + (b.x - a.x) * t1;
        const ym = a.y + (b.y - a.y) * t1;
        const x2 = a.x + (b.x - a.x) * ((i + 1) / steps);
        const y2 = a.y + (b.y - a.y) * ((i + 1) / steps);
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(xm - (ym - y0) * 0.3, ym + (xm - x0) * 0.3);
        ctx.lineTo(x2, y2);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private drawSpinner(game: Game, theme: Theme) {
    const spinner = game.table.spinner;
    if (!spinner) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(spinner.pos.x, spinner.pos.y);
    ctx.rotate(spinner.angle + Math.sin(spinner.spinAngle) * 1.4);
    const half = spinner.length / 2;
    const unit = 3;
    ctx.fillStyle = shade(theme.accentA, -0.1);
    ctx.fillRect(px(-half, unit), -3, px(spinner.length, unit), 6);
    ctx.fillStyle = shade(theme.accentA, 0.3);
    ctx.fillRect(px(-half, unit), -3, px(spinner.length, unit), 2);
    ctx.fillStyle = "#1c1710";
    ctx.fillRect(-3, -5, 6, 10);
    ctx.restore();
  }

  private drawDropTargets(game: Game, theme: Theme) {
    const bank = game.table.dropBank;
    if (!bank) return;
    const ctx = this.ctx;
    for (const t of bank.targets) {
      if (t.dropped) continue;
      ctx.save();
      ctx.translate(t.pos.x, t.pos.y);
      ctx.rotate(t.angle);
      const w = t.width;
      const h = t.height;
      ctx.fillStyle = "#241a10";
      ctx.fillRect(-w / 2 - 1, -h / 2 - 1, w + 2, h + 2);
      ctx.fillStyle = shade("#8a6a42", -0.1);
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.fillStyle = shade("#8a6a42", 0.25);
      ctx.fillRect(-w / 2, -h / 2, w, 2);
      ctx.fillStyle = theme.accentA;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }

  private drawRamp(game: Game, theme: Theme) {
    const ramp = game.table.ramp;
    if (!ramp) return;
    const ctx = this.ctx;
    const steps = 16;
    const stepUnit = 6;
    ctx.save();
    for (let i = 0; i < steps; i++) {
      const p = ramp.pointAt(i / steps);
      const glow = ramp.flash > 0 ? "#ffffff" : shade(theme.accentC, -0.1 + (i % 2) * 0.12);
      ctx.fillStyle = shade(glow, -0.35);
      ctx.fillRect(px(p.x - stepUnit, 2) - 1, px(p.y - 3, 2) - 1, stepUnit + 2, 6);
      ctx.fillStyle = glow;
      ctx.fillRect(px(p.x - stepUnit, 2), px(p.y - 3, 2), stepUnit, 4);
    }
    ctx.restore();
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

  private drawRollovers(game: Game, theme: Theme, now: number) {
    const ctx = this.ctx;
    const skillActive = game.skillShotDeadline > 0 && now <= game.skillShotDeadline;
    for (const r of game.table.rollovers) {
      const isSkillLit = r.skillShot && skillActive && r.lit;
      const color = r.lit ? (isSkillLit ? "#ffd23f" : theme.accentB) : "#2a2a30";
      ctx.save();
      ctx.translate(r.body.position.x, r.body.position.y);
      if (r.lit) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 8 + r.flash * 14;
      }
      ctx.fillStyle = shade(color, -0.4);
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(9, 0);
      ctx.lineTo(0, 9);
      ctx.lineTo(-9, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(6, 0);
      ctx.lineTo(0, 6);
      ctx.lineTo(-6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  private drawFlipper(flipper: Game["table"]["leftFlipper"], theme: Theme) {
    const ctx = this.ctx;
    const b = flipper.body;
    const dir = flipper.side === "left" ? 1 : -1;
    ctx.save();
    ctx.translate(b.position.x, b.position.y);
    ctx.rotate(b.angle);
    const len = flipper.length;
    const unit = 3;

    // tapered pixel club: narrow at the pivot end, wide at the striking tip
    ctx.fillStyle = "#1c1710";
    ctx.fillRect(px(-len / 2 - 2, unit), -12, px(len + 4, unit), 24);
    const segments = 8;
    for (let i = 0; i < segments; i++) {
      const t0 = i / segments;
      const segW = len / segments;
      const x = -len / 2 + i * segW;
      const taperT = dir > 0 ? t0 : 1 - t0;
      const halfH = 6 + taperT * 4;
      ctx.fillStyle = shade(theme.accentA, -0.15 + (i % 2) * 0.06);
      ctx.fillRect(px(x, unit), -halfH, px(segW + 1, unit), halfH * 2);
    }
    ctx.fillStyle = shade(theme.accentA, 0.3);
    ctx.fillRect(px(-len / 2, unit), -3, px(len, unit), 2);
    ctx.restore();
  }

  private drawBalls(game: Game) {
    const ctx = this.ctx;
    for (const ball of game.balls) {
      for (let i = ball.trail.length - 1; i >= 0; i--) {
        const p = ball.trail[i];
        const alpha = (1 - i / ball.trail.length) * 0.22;
        const s = BALL_RADIUS * (1 - i / ball.trail.length) * 1.6;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#cfe3ff";
        ctx.fillRect(px(p.x - s / 2, 2), px(p.y - s / 2, 2), px(s, 2), px(s, 2));
      }
      ctx.globalAlpha = 1;
      const pos = ball.body.position;
      drawPixelDisc(ctx, pos.x, pos.y, BALL_RADIUS, "#b9c4d6", 8, "#12161d");
    }
  }

  private drawPopups(game: Game, now: number) {
    const ctx = this.ctx;
    for (const p of game.popups) {
      const age = now - p.born;
      const t = age / 1100;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - t);
      ctx.font = "10px 'Press Start 2P', monospace";
      ctx.textAlign = "center";
      const y = p.y - t * 34;
      ctx.fillStyle = "#000000";
      ctx.fillText(p.text, p.x + 1, y + 1);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, y);
      ctx.restore();
    }
  }

  private drawVignette() {
    const ctx = this.ctx;
    const g = ctx.createRadialGradient(
      TABLE_WIDTH / 2,
      TABLE_HEIGHT / 2,
      TABLE_HEIGHT * 0.32,
      TABLE_WIDTH / 2,
      TABLE_HEIGHT / 2,
      TABLE_HEIGHT * 0.72
    );
    g.addColorStop(0, "transparent");
    g.addColorStop(1, "rgba(0,0,0,0.65)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
  }
}
