import Matter from "matter-js";
import { CAT } from "../core/constants";
import type { BumperDef } from "../levels/types";

const POP_FORCE = 0.055;

export class Bumper {
  id: string;
  body: Matter.Body;
  score: number;
  flash = 0;
  lit = false;

  constructor(def: BumperDef) {
    this.id = def.id;
    this.score = def.score;
    const r = def.radius ?? 24;
    this.body = Matter.Bodies.circle(def.pos.x, def.pos.y, r, {
      isStatic: true,
      restitution: 1.05,
      label: `bumper:${def.id}`,
      collisionFilter: { category: CAT.BUMPER }
    });
  }

  hit(ballBody: Matter.Body) {
    const dx = ballBody.position.x - this.body.position.x;
    const dy = ballBody.position.y - this.body.position.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;
    Matter.Body.applyForce(ballBody, ballBody.position, { x: nx * POP_FORCE, y: ny * POP_FORCE });
    this.flash = 1;
    this.lit = true;
  }

  update(dt: number) {
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt / 220);
  }
}
