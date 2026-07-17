import Matter from "matter-js";
import { CAT } from "../core/constants";
import type { RampDef } from "../levels/types";
import { catmullRomPoint } from "../physics/geometry";

export class Ramp {
  id: string;
  def: RampDef;
  entrySensor: Matter.Body;
  runs = 0;
  flash = 0;
  private cooldownUntil = 0;

  constructor(def: RampDef) {
    this.id = def.id;
    this.def = def;
    this.entrySensor = Matter.Bodies.circle(def.entry.x, def.entry.y, def.entryRadius ?? 20, {
      isStatic: true,
      isSensor: true,
      label: `ramp:${def.id}`,
      collisionFilter: { category: CAT.SENSOR }
    });
  }

  canTrigger(now: number, ballSpeed: number) {
    return now > this.cooldownUntil && ballSpeed >= this.def.minEntrySpeed;
  }

  trigger(now: number) {
    this.cooldownUntil = now + 900;
    this.runs++;
    this.flash = 1;
  }

  pointAt(t: number) {
    return catmullRomPoint(this.def.path, t);
  }

  update(dt: number) {
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt / 260);
  }
}
