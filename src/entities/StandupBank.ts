import Matter from "matter-js";
import { CAT } from "../core/constants";
import type { StandupBankDef, StandupRole } from "../levels/types";

interface StandupTarget {
  id: string;
  body: Matter.Body;
  lit: boolean;
  flash: number;
  pos: { x: number; y: number };
  width: number;
  height: number;
  angle: number;
}

/**
 * A bank of standup targets: unlike drop targets these never fall and never
 * stop colliding — hitting one just latches it "lit". Used for arrow
 * targets, lock targets, and plain scoring standups.
 */
export class StandupBank {
  id: string;
  role: StandupRole;
  score: number;
  targets: StandupTarget[];
  private _enabled: boolean;

  constructor(def: StandupBankDef) {
    this.id = def.id;
    this.role = def.role;
    this.score = def.score;
    this._enabled = def.enabled ?? true;
    this.targets = def.targets.map((t) => {
      const width = t.width ?? 16;
      const height = t.height ?? 14;
      const angle = t.angle ?? 0;
      const body = Matter.Bodies.rectangle(t.pos.x, t.pos.y, width, height, {
        isStatic: true,
        angle,
        // A disabled bank (e.g. locks before the arrows light them) is a
        // sensor so it doesn't physically block shots at features above it.
        isSensor: !this._enabled,
        label: `standup:${def.id}:${t.id}`,
        collisionFilter: { category: CAT.TARGET }
      });
      return { id: t.id, body, lit: false, flash: 0, pos: t.pos, width, height, angle };
    });
  }

  get enabled() {
    return this._enabled;
  }

  set enabled(value: boolean) {
    this._enabled = value;
    for (const t of this.targets) t.body.isSensor = !value;
  }

  get bodies() {
    return this.targets.map((t) => t.body);
  }

  /** Returns true if this hit newly lit the target (first hit). */
  hit(targetId: string): boolean {
    const t = this.targets.find((x) => x.id === targetId);
    if (!t) return false;
    t.flash = 1;
    if (t.lit) return false;
    t.lit = true;
    return true;
  }

  get allLit() {
    return this.targets.every((t) => t.lit);
  }

  get litCount() {
    return this.targets.filter((t) => t.lit).length;
  }

  update(dt: number) {
    for (const t of this.targets) {
      if (t.flash > 0) t.flash = Math.max(0, t.flash - dt / 220);
    }
  }
}
