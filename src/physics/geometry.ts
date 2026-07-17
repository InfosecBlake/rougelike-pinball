import Matter from "matter-js";
import { CAT, PHYSICS } from "../core/constants";
import type { Vec2 } from "../levels/types";

/** Build a chain of thin static rectangle bodies following a polyline — robust for concave rail shapes. */
export function wallChain(points: Vec2[], thickness = 12, restitution = PHYSICS.wallRestitution): Matter.Body[] {
  const bodies: Matter.Body[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len < 0.001) continue;
    const cx = (a.x + b.x) / 2;
    const cy = (a.y + b.y) / 2;
    const angle = Math.atan2(dy, dx);
    const body = Matter.Bodies.rectangle(cx, cy, len + thickness * 0.4, thickness, {
      angle,
      isStatic: true,
      restitution,
      friction: 0.05,
      chamfer: { radius: thickness / 2.2 },
      collisionFilter: { category: CAT.WALL },
      render: { visible: false }
    });
    bodies.push(body);
  }
  return bodies;
}

export function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpVec(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

/** Quadratic-ish multi-point Catmull-Rom sampler for smooth ramp paths. */
export function catmullRomPoint(points: Vec2[], t: number): Vec2 {
  const n = points.length - 1;
  const segT = t * n;
  const i = Math.max(0, Math.min(n - 1, Math.floor(segT)));
  const localT = segT - i;
  const p0 = points[Math.max(0, i - 1)];
  const p1 = points[i];
  const p2 = points[Math.min(n, i + 1)];
  const p3 = points[Math.min(n, i + 2)];
  const t2 = localT * localT;
  const t3 = t2 * localT;
  const x =
    0.5 *
    (2 * p1.x +
      (-p0.x + p2.x) * localT +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
  const y =
    0.5 *
    (2 * p1.y +
      (-p0.y + p2.y) * localT +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
  return { x, y };
}

export function angleLerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
