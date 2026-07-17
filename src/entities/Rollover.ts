import Matter from "matter-js";
import { CAT } from "../core/constants";
import type { RolloverDef } from "../levels/types";

export class Rollover {
  id: string;
  body: Matter.Body;
  score: number;
  label: string;
  skillShot: boolean;
  lit: boolean;
  flash = 0;

  constructor(def: RolloverDef) {
    this.id = def.id;
    this.score = def.score;
    this.label = def.label;
    this.skillShot = !!def.skillShot;
    this.lit = def.lit ?? true;
    this.body = Matter.Bodies.circle(def.pos.x, def.pos.y, def.radius ?? 11, {
      isStatic: true,
      isSensor: true,
      label: `rollover:${def.id}`,
      collisionFilter: { category: CAT.SENSOR }
    });
  }

  update(dt: number) {
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt / 300);
  }
}
