// Procedural pixel-art helpers: everything here is generated at runtime from
// code (no image assets), then cached so the per-frame render loop only ever
// blits pre-built canvases instead of re-generating texture noise.

export function mulberry32(seed: number) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return h;
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function clamp255(v: number) {
  return Math.max(0, Math.min(255, v));
}

/** Lighten (amt > 0) or darken (amt < 0) a hex color, amt in [-1, 1]. */
export function shade(hex: string, amt: number): string {
  const { r, g, b } = hexToRgb(hex);
  const mix = (c: number) => clamp255(amt >= 0 ? c + (255 - c) * amt : c + c * amt);
  const nr = Math.round(mix(r));
  const ng = Math.round(mix(g));
  const nb = Math.round(mix(b));
  return `#${nr.toString(16).padStart(2, "0")}${ng.toString(16).padStart(2, "0")}${nb.toString(16).padStart(2, "0")}`;
}

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

/** Snap a coordinate to the nearest pixel-art grid line. */
export function px(v: number, unit = 3): number {
  return Math.round(v / unit) * unit;
}

// ---------- Brick tile (repeating pattern) ----------

export const BRICK_TILE_W = 72;
export const BRICK_TILE_H = 36;

export function buildBrickTile(baseColor: string, mortarColor: string, seed: number): HTMLCanvasElement {
  const c = makeCanvas(BRICK_TILE_W, BRICK_TILE_H);
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  const rng = mulberry32(seed);

  ctx.fillStyle = mortarColor;
  ctx.fillRect(0, 0, BRICK_TILE_W, BRICK_TILE_H);

  const brickW = 18;
  const brickH = 15;
  const gap = 3;
  for (let row = 0; row < 2; row++) {
    const offset = row % 2 === 0 ? 0 : -brickW / 2;
    for (let col = -1; col < 5; col++) {
      const x = col * (brickW + gap) + offset;
      const y = row * (brickH + gap);
      const wear = (rng() - 0.5) * 0.22;
      ctx.fillStyle = shade(baseColor, wear);
      ctx.fillRect(x, y, brickW, brickH);
      // beveled highlight (top/left) and shadow (bottom/right) for a chunky carved look
      ctx.fillStyle = shade(baseColor, wear + 0.16);
      ctx.fillRect(x, y, brickW, 2);
      ctx.fillRect(x, y, 2, brickH);
      ctx.fillStyle = shade(baseColor, wear - 0.22);
      ctx.fillRect(x, y + brickH - 2, brickW, 2);
      ctx.fillRect(x + brickW - 2, y, 2, brickH);
      // occasional pockmark
      if (rng() < 0.3) {
        ctx.fillStyle = shade(baseColor, wear - 0.3);
        const px1 = x + 3 + Math.floor(rng() * (brickW - 8));
        const py1 = y + 3 + Math.floor(rng() * (brickH - 8));
        ctx.fillRect(px1, py1, 2, 2);
      }
    }
  }
  return c;
}

// ---------- Full-table detail overlay: moss patches + cracks ----------

export function buildDetailOverlay(width: number, height: number, mossColor: string, mossDark: string, crackColor: string, seed: number): HTMLCanvasElement {
  const c = makeCanvas(width, height);
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  const rng = mulberry32(seed);
  const unit = 3;

  const mossBlob = (cx: number, cy: number, size: number) => {
    for (let i = 0; i < size * size * 1.6; i++) {
      if (rng() > 0.55) continue;
      const dx = (rng() - 0.5) * size * unit * 2;
      const dy = (rng() - 0.5) * size * unit * 1.4;
      const dist = Math.hypot(dx, dy) / (size * unit);
      if (dist > 1) continue;
      ctx.globalAlpha = 0.5 + rng() * 0.4 - dist * 0.3;
      ctx.fillStyle = rng() < 0.35 ? mossDark : mossColor;
      ctx.fillRect(px(cx + dx, unit), px(cy + dy, unit), unit, unit);
    }
  };

  // Moss creeps in along the left/right rails and pools near the bottom.
  const mossCount = 34;
  for (let i = 0; i < mossCount; i++) {
    const nearEdge = rng() < 0.7;
    const x = nearEdge ? (rng() < 0.5 ? rng() * width * 0.18 : width - rng() * width * 0.18) : rng() * width;
    const yBias = Math.pow(rng(), 0.6);
    const y = height * (0.55 + yBias * 0.45);
    mossBlob(x, y, 3 + Math.floor(rng() * 4));
  }
  // A little moss up near the top arc too, sparser.
  for (let i = 0; i < 8; i++) {
    mossBlob(rng() * width, height * 0.08 + rng() * height * 0.1, 2 + Math.floor(rng() * 3));
  }

  const crack = (sx: number, sy: number) => {
    let cx = sx;
    let cy = sy;
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = crackColor;
    const steps = 8 + Math.floor(rng() * 12);
    for (let i = 0; i < steps; i++) {
      ctx.fillRect(px(cx, unit), px(cy, unit), unit, unit);
      cx += (rng() - 0.5) * 11;
      cy += rng() * 8;
      if (rng() < 0.25) {
        let bx = cx;
        let by = cy;
        const branchSteps = 3 + Math.floor(rng() * 4);
        for (let j = 0; j < branchSteps; j++) {
          ctx.fillRect(px(bx, unit), px(by, unit), unit, unit);
          bx += (rng() - 0.5) * 9;
          by += rng() * 6;
        }
      }
    }
    ctx.globalAlpha = 1;
  };

  const crackCount = 5 + Math.floor(rng() * 4);
  for (let i = 0; i < crackCount; i++) {
    crack(rng() * width, rng() * height * 0.75);
  }

  ctx.globalAlpha = 1;
  return c;
}

// ---------- Leaky water drips (animated, drawn per-frame) ----------

export interface DripEmitter {
  x: number;
  topY: number;
  bottomY: number;
  period: number;
  phase: number;
}

export function makeDripEmitters(points: { x: number; topY: number; bottomY: number }[], seed: number): DripEmitter[] {
  const rng = mulberry32(seed);
  return points.map((p) => ({ ...p, period: 2.2 + rng() * 2.4, phase: rng() * 10 }));
}

const WATER_LIGHT = "#8fe0f0";
const WATER_DARK = "#1c4a55";

/** A permanent damp streak + moss-stained crack down the wall, so a leak reads even between drops. */
export function drawDampTrail(ctx: CanvasRenderingContext2D, e: DripEmitter) {
  const unit = 2;
  ctx.save();
  for (let y = e.topY; y < e.bottomY; y += unit) {
    const t = (y - e.topY) / (e.bottomY - e.topY);
    ctx.globalAlpha = 0.16 + t * 0.16;
    ctx.fillStyle = WATER_DARK;
    ctx.fillRect(px(e.x - unit, unit), px(y, unit), unit, unit);
    ctx.fillRect(px(e.x + unit, unit), px(y, unit), unit, unit);
  }
  ctx.restore();
}

export function drawWaterDrip(ctx: CanvasRenderingContext2D, e: DripEmitter, now: number) {
  const t = ((now / 1000 + e.phase) % e.period) / e.period;
  const unit = 3;
  if (t < 0.7) {
    const travel = t / 0.7;
    const y = e.topY + (e.bottomY - e.topY) * travel;
    ctx.save();
    ctx.shadowColor = WATER_LIGHT;
    ctx.shadowBlur = 4;
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = WATER_LIGHT;
    ctx.fillRect(px(e.x, unit), px(y, unit), unit, unit * 2);
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = WATER_DARK;
    ctx.fillRect(px(e.x, unit), px(y - unit * 2, unit), unit, unit);
    ctx.restore();
  } else {
    const splashT = (t - 0.7) / 0.3;
    const r = splashT * 9;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - splashT) * 0.85;
    ctx.strokeStyle = WATER_LIGHT;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(e.x, e.bottomY, r, r * 0.4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

export function drawPuddle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save();
  ctx.globalAlpha = 0.65;
  ctx.fillStyle = WATER_DARK;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = WATER_LIGHT;
  ctx.beginPath();
  ctx.ellipse(x - r * 0.2, y - r * 0.05, r * 0.45, r * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

