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
  hashString,
  shade,
  type DripEmitter
} from "./PixelArt";

type Theme = Game["table"]["def"]["theme"];

function poly(ctx: CanvasRenderingContext2D, pts: Vec2[]) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
}

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

    this.drawBackground(theme, now);
    this.drawWaterDrips(now);
    this.drawWalls(theme);
    this.drawLauncher(game, theme);
    this.drawDropTargets(game, theme);
    this.drawStandupBanks(game, theme);
    this.drawRamps(game, theme);
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

  private drawBackground(theme: Theme, now: number) {
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
      // drifting dust/spore motes for atmosphere
      const rng = (i: number) => {
        const x = Math.sin(i * 12.9898) * 43758.5453;
        return x - Math.floor(x);
      };
      for (let i = 0; i < 34; i++) {
        const x = rng(i) * TABLE_WIDTH;
        const y = (rng(i + 99) * TABLE_HEIGHT + now / 260 + i * 40) % TABLE_HEIGHT;
        ctx.globalAlpha = 0.08 + rng(i + 5) * 0.14;
        ctx.fillStyle = theme.accentB;
        ctx.beginPath();
        ctx.arc(x, y, 0.9, 0, Math.PI * 2);
        ctx.fill();
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
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    poly(ctx, pts);
    ctx.strokeStyle = shade(color, -0.45);
    ctx.lineWidth = width + 2.5;
    ctx.stroke();
    poly(ctx, pts);
    const grad = ctx.createLinearGradient(0, 0, 0, TABLE_HEIGHT);
    grad.addColorStop(0, shade(color, 0.18));
    grad.addColorStop(1, shade(color, -0.1));
    ctx.strokeStyle = grad;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  private drawWalls(theme: Theme) {
    const rail = theme.rail;
    this.stoneStroke(outerBoundary(), rail, 11);
    this.stoneStroke(laneDivider(), rail, 8);
    this.stoneStroke(laneFloor(), rail, 9);
    this.stoneStroke(rightOutlaneGuide(), rail, 7);
    this.stoneStroke(leftInlaneGuide(), rail, 6);

    // soft torchlight rim along the top arc
    const ctx = this.ctx;
    ctx.save();
    ctx.shadowColor = theme.glow;
    ctx.shadowBlur = 7;
    poly(ctx, outerBoundary());
    ctx.strokeStyle = theme.glow + "55";
    ctx.lineWidth = 1.3;
    ctx.lineJoin = "round";
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
    ctx.lineCap = "round";
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

  /** Classic glossy pop-bumper: metal bezel, domed cap, bright light-ring when lit. */
  private drawBumpers(game: Game, theme: Theme) {
    for (const b of game.table.bumpers) this.drawBumper(b, theme, false);
    if (game.table.keeper) this.drawBumper(game.table.keeper, theme, true);
  }

  private drawBumper(b: Game["table"]["bumpers"][number], theme: Theme, isKeeper: boolean) {
    const ctx = this.ctx;
    const r = (b.body as any).circleRadius ?? 24;
    const pos = b.body.position;
    const lit = b.lit || b.flash > 0;
    const bossColor = isKeeper ? "#c73a45" : theme.accentA;
    const capColor = b.flash > 0 ? "#ffffff" : lit ? bossColor : "#4a4038";

    ctx.save();
    if (isKeeper) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r + 8, 0, Math.PI * 2);
      ctx.strokeStyle = shade("#c73a45", -0.2);
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // metal bezel
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r + 3, 0, Math.PI * 2);
    ctx.strokeStyle = shade(theme.rail, -0.35);
    ctx.lineWidth = isKeeper ? 5 : 4;
    ctx.stroke();

    // glossy dome
    const grad = ctx.createRadialGradient(pos.x - r * 0.35, pos.y - r * 0.35, r * 0.15, pos.x, pos.y, r);
    grad.addColorStop(0, shade(capColor, 0.55));
    grad.addColorStop(0.55, capColor);
    grad.addColorStop(1, shade(capColor, -0.35));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
    ctx.fill();

    if (isKeeper) {
      // a simple skull glyph so the boss target reads clearly even unlit
      ctx.fillStyle = lit ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.28)";
      ctx.beginPath();
      ctx.arc(pos.x, pos.y - r * 0.15, r * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(pos.x - r * 0.28, pos.y + r * 0.05, r * 0.56, r * 0.28);
      ctx.fillStyle = capColor;
      ctx.beginPath();
      ctx.arc(pos.x - r * 0.16, pos.y - r * 0.18, r * 0.1, 0, Math.PI * 2);
      ctx.arc(pos.x + r * 0.16, pos.y - r * 0.18, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // light ring
    if (lit) {
      ctx.shadowColor = bossColor;
      ctx.shadowBlur = 8 + b.flash * 18;
      ctx.strokeStyle = shade(bossColor, 0.4);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r * 0.86, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  /** Classic triangular slingshot kicker with a rubber-band highlight edge. */
  private drawSlingshots(game: Game) {
    const ctx = this.ctx;
    for (const s of game.table.slingshots) {
      const verts = (s.body.vertices ?? []) as Vec2[];
      if (!verts.length) continue;
      const hit = s.flash > 0;
      const cx = (verts[0].x + verts[1].x + verts[2].x) / 3;
      const cy = (verts[0].y + verts[1].y + verts[2].y) / 3;

      ctx.save();
      poly(ctx, verts);
      ctx.closePath();
      const grad = ctx.createLinearGradient(verts[0].x, verts[0].y, cx, cy);
      grad.addColorStop(0, hit ? "#ffffff" : "#e6485a");
      grad.addColorStop(1, hit ? "#ffe0e0" : "#8a1a28");
      ctx.fillStyle = grad;
      ctx.shadowColor = hit ? "#ffffff" : "#e6485a";
      ctx.shadowBlur = hit ? 14 : 4;
      ctx.fill();

      // rubber-band trim along the top edge
      ctx.beginPath();
      ctx.moveTo(verts[0].x, verts[0].y);
      ctx.lineTo(verts[1].x, verts[1].y);
      ctx.strokeStyle = hit ? "#ffffff" : "#ffb3bc";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.restore();
    }
  }

  /** Classic reflective spinner blade on a metal axle. */
  private drawSpinner(game: Game, theme: Theme) {
    const spinner = game.table.spinner;
    if (!spinner) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(spinner.pos.x, spinner.pos.y);
    ctx.rotate(spinner.angle + Math.sin(spinner.spinAngle) * 1.4);
    const half = spinner.length / 2;
    const grad = ctx.createLinearGradient(-half, 0, half, 0);
    grad.addColorStop(0, shade(theme.accentA, -0.3));
    grad.addColorStop(0.5, shade(theme.accentA, 0.45));
    grad.addColorStop(1, shade(theme.accentA, -0.3));
    ctx.strokeStyle = grad;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-half, 0);
    ctx.lineTo(half, 0);
    ctx.stroke();
    ctx.fillStyle = shade(theme.rail, -0.3);
    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /** Classic upright plastic drop target with a beveled highlight. */
  private drawDropTargets(game: Game, theme: Theme) {
    const ctx = this.ctx;
    for (const bank of game.table.dropBanks) {
      for (const t of bank.targets) {
        if (t.dropped) continue;
        ctx.save();
        ctx.translate(t.pos.x, t.pos.y);
        ctx.rotate(t.angle);
        const w = t.width;
        const h = t.height;
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(-w / 2 - 1, -h / 2 - 1 + 1.5, w + 2, h + 2);
        const grad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
        grad.addColorStop(0, shade(theme.accentA, 0.35));
        grad.addColorStop(1, shade(theme.accentA, -0.25));
        ctx.fillStyle = grad;
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.strokeStyle = shade(theme.accentA, -0.5);
        ctx.lineWidth = 1;
        ctx.strokeRect(-w / 2, -h / 2, w, h);
        ctx.restore();
      }
    }
  }

  /** Arrow targets, lock targets, and plain standups — each bank rendered per its role. */
  private drawStandupBanks(game: Game, theme: Theme) {
    const ctx = this.ctx;
    for (const bank of game.table.standupBanks) {
      for (const t of bank.targets) {
        const w = t.width;
        const h = t.height;
        ctx.save();
        ctx.translate(t.pos.x, t.pos.y);
        ctx.rotate(t.angle);

        if (bank.role === "arrow") {
          const color = t.lit ? "#8ee666" : "#3a4a30";
          ctx.fillStyle = "rgba(0,0,0,0.3)";
          ctx.beginPath();
          ctx.moveTo(0, -h / 2 + 1.5);
          ctx.lineTo(w / 2 + 1.5, h / 2 + 1.5);
          ctx.lineTo(-w / 2 - 1.5, h / 2 + 1.5);
          ctx.closePath();
          ctx.fill();
          if (t.lit || t.flash > 0) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 6 + t.flash * 14;
          }
          ctx.fillStyle = t.flash > 0 ? "#ffffff" : color;
          ctx.beginPath();
          ctx.moveTo(0, -h / 2);
          ctx.lineTo(w / 2, h / 2);
          ctx.lineTo(-w / 2, h / 2);
          ctx.closePath();
          ctx.fill();
        } else if (bank.role === "lock") {
          const disabled = !bank.enabled;
          const color = t.lit ? "#ffd23f" : disabled ? "#3a342c" : "#8a6a2a";
          ctx.globalAlpha = disabled ? 0.5 : 1;
          if (t.lit || t.flash > 0) {
            ctx.shadowColor = "#ffd23f";
            ctx.shadowBlur = 6 + t.flash * 14;
          }
          ctx.strokeStyle = t.flash > 0 ? "#ffffff" : color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, -h / 2, w * 0.28, Math.PI, 0);
          ctx.stroke();
          ctx.fillStyle = t.flash > 0 ? "#ffffff" : color;
          ctx.fillRect(-w / 2, -h / 2, w, h);
          ctx.globalAlpha = 1;
        } else {
          const color = t.lit ? theme.accentB : shade(theme.accentB, -0.5);
          ctx.fillStyle = "rgba(0,0,0,0.3)";
          ctx.fillRect(-w / 2 - 1, -h / 2 + 1.5, w + 2, h + 2);
          if (t.flash > 0) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 10 * t.flash;
          }
          ctx.fillStyle = t.flash > 0 ? "#ffffff" : color;
          ctx.fillRect(-w / 2, -h / 2, w, h);
        }
        ctx.restore();
      }
    }
  }

  /** Classic glowing plastic ramp track, rendered as a smooth lit tube. */
  private drawRamps(game: Game, theme: Theme) {
    const ctx = this.ctx;
    for (const ramp of game.table.ramps) {
      const pts: Vec2[] = [];
      for (let i = 0; i <= 24; i++) pts.push(ramp.pointAt(i / 24));
      const glowColor = ramp.flash > 0 ? "#ffffff" : theme.accentC;

      ctx.save();
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      poly(ctx, pts);
      ctx.strokeStyle = shade(glowColor, -0.5);
      ctx.lineWidth = 9;
      ctx.stroke();

      poly(ctx, pts);
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 6 + ramp.flash * 18;
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 6;
      ctx.stroke();

      poly(ctx, pts);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = shade(glowColor, 0.5);
      ctx.lineWidth = 2;
      ctx.stroke();
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
  }

  /** Classic round flush lane-light insert. The gate gets a bigger arched-door treatment. */
  private drawRollovers(game: Game, theme: Theme, now: number) {
    const ctx = this.ctx;
    const skillActive = game.skillShotDeadline > 0 && now <= game.skillShotDeadline;
    for (const r of game.table.rollovers) {
      const isGate = game.table.def.gateId === r.id;
      const isSkillLit = r.skillShot && skillActive && r.lit;
      const color = r.lit ? (isGate ? "#8ee6ff" : isSkillLit ? "#ffd23f" : theme.accentB) : "#2a2a30";
      const pos = r.body.position;
      const radius = isGate ? 13 : 8;
      ctx.save();

      if (isGate) {
        // stone archway frame, always visible so the gate reads before it lights up
        const frameR = radius + 5;
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, frameR, Math.PI, 0);
        ctx.lineTo(pos.x + frameR, pos.y + 7);
        ctx.lineTo(pos.x - frameR, pos.y + 7);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#8a7248";
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      if (r.lit) {
        ctx.shadowColor = color;
        ctx.shadowBlur = (isGate ? 12 : 9) + r.flash * 14;
      }
      const grad = ctx.createRadialGradient(pos.x, pos.y, 1, pos.x, pos.y, radius);
      grad.addColorStop(0, shade(color, 0.5));
      grad.addColorStop(1, color);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius - 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = shade(color, -0.4);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
  }

  /** Classic glossy plastic flipper paddle with a metal pivot cap. */
  private drawFlipper(flipper: Game["table"]["leftFlipper"], theme: Theme) {
    const ctx = this.ctx;
    const b = flipper.body;
    ctx.save();
    ctx.translate(b.position.x, b.position.y);
    ctx.rotate(b.angle);
    const len = flipper.length;

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.roundRect(-len / 2, -10, len, 21, 10);
    ctx.fill();

    const grad = ctx.createLinearGradient(0, -10, 0, 10);
    grad.addColorStop(0, shade(theme.accentA, 0.45));
    grad.addColorStop(0.55, theme.accentA);
    grad.addColorStop(1, shade(theme.accentA, -0.35));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(-len / 2, -10, len, 20, 10);
    ctx.fill();

    ctx.fillStyle = shade(theme.accentA, 0.6);
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.roundRect(-len / 2 + 3, -7, len - 6, 3, 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    const pivotX = flipper.side === "left" ? -len / 2 : len / 2;
    ctx.fillStyle = shade(theme.rail, -0.2);
    ctx.beginPath();
    ctx.arc(pivotX, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = shade(theme.rail, 0.3);
    ctx.beginPath();
    ctx.arc(pivotX, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /** Classic chrome pinball with a smooth motion trail. */
  private drawBalls(game: Game) {
    const ctx = this.ctx;
    for (const ball of game.balls) {
      for (let i = ball.trail.length - 1; i >= 0; i--) {
        const p = ball.trail[i];
        const alpha = (1 - i / ball.trail.length) * 0.22;
        ctx.beginPath();
        ctx.fillStyle = `rgba(200,225,255,${alpha})`;
        ctx.arc(p.x, p.y, BALL_RADIUS * (1 - i / ball.trail.length) * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
      const pos = ball.body.position;
      const grad = ctx.createRadialGradient(pos.x - 3, pos.y - 3, 1, pos.x, pos.y, BALL_RADIUS);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.5, "#cfe3ff");
      grad.addColorStop(1, "#69809f");
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;
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
      ctx.font = "700 15px 'Cinzel', serif";
      ctx.textAlign = "center";
      const y = p.y - t * 34;
      ctx.fillStyle = "rgba(0,0,0,0.8)";
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
