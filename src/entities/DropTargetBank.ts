import Matter from "matter-js";
import { CAT } from "../core/constants";
import type { DropTargetBankDef } from "../levels/types";

interface DropTarget {
  id: string;
  body: Matter.Body;
  dropped: boolean;
  pos: { x: number; y: number };
  width: number;
  height: number;
  angle: number;
}

export class DropTargetBank {
  id: string;
  targets: DropTarget[];
  bonus: number;
  resetTimer = 0;
  score = 750;

  constructor(def: DropTargetBankDef) {
    this.id = def.id;
    this.bonus = def.bonus;
    this.targets = def.targets.map((t) => {
      const width = t.width ?? 34;
      const height = t.height ?? 12;
      const angle = t.angle ?? 0;
      const body = Matter.Bodies.rectangle(t.pos.x, t.pos.y, width, height, {
        isStatic: true,
        angle,
        label: `target:${def.id}:${t.id}`,
        collisionFilter: { category: CAT.TARGET }
      });
      return { id: t.id, body, dropped: false, pos: t.pos, width, height, angle };
    });
  }

  get bodies() {
    return this.targets.map((t) => t.body);
  }

  drop(targetId: string): boolean {
    const t = this.targets.find((x) => x.id === targetId);
    if (!t || t.dropped) return false;
    t.dropped = true;
    t.body.isSensor = true;
    return true;
  }

  get allDropped() {
    return this.targets.every((t) => t.dropped);
  }

  get downedCount() {
    return this.targets.filter((t) => t.dropped).length;
  }

  update(dt: number) {
    if (this.allDropped) {
      this.resetTimer += dt;
      if (this.resetTimer > 1500) {
        this.resetTimer = 0;
        for (const t of this.targets) {
          t.dropped = false;
          t.body.isSensor = false;
        }
      }
    }
  }
}
