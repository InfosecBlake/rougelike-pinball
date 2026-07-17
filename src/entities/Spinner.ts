import Matter from "matter-js";
import { CAT } from "../core/constants";
import type { SpinnerDef } from "../levels/types";

export class Spinner {
  id: string;
  body: Matter.Body;
  score: number;
  pos: { x: number; y: number };
  angle: number;
  length: number;
  spinAngle = 0;
  spinVelocity = 0;
  spins = 0;
  private lastHitAt = 0;

  constructor(def: SpinnerDef) {
    this.id = def.id;
    this.score = def.score;
    this.pos = def.pos;
    this.angle = def.angle;
    this.length = def.length ?? 60;
    this.body = Matter.Bodies.rectangle(def.pos.x, def.pos.y, this.length, 6, {
      angle: def.angle,
      isStatic: true,
      isSensor: true,
      label: `spinner:${def.id}`,
      collisionFilter: { category: CAT.SENSOR }
    });
  }

  hit(now: number) {
    if (now - this.lastHitAt < 120) return false;
    this.lastHitAt = now;
    this.spinVelocity += 0.55;
    this.spins++;
    return true;
  }

  update(dt: number) {
    if (this.spinVelocity !== 0) {
      this.spinAngle += this.spinVelocity * (dt / 16.7);
      this.spinVelocity *= 0.94;
      if (Math.abs(this.spinVelocity) < 0.01) this.spinVelocity = 0;
    }
  }
}
