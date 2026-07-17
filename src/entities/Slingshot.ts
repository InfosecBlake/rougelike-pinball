import Matter from "matter-js";
import { CAT } from "../core/constants";
import type { SlingshotDef } from "../levels/types";

const KICK_FORCE = 0.07;

export class Slingshot {
  id: string;
  body: Matter.Body;
  score: number;
  pushDir: { x: number; y: number };
  flash = 0;

  constructor(def: SlingshotDef) {
    this.id = def.id;
    this.score = def.score;
    this.pushDir = def.pushDir;
    const verts = [def.points[0], def.points[1], def.points[2]];
    const cx = (verts[0].x + verts[1].x + verts[2].x) / 3;
    const cy = (verts[0].y + verts[1].y + verts[2].y) / 3;
    this.body = Matter.Bodies.fromVertices(cx, cy, [verts], {
      isStatic: true,
      restitution: 0.9,
      label: `slingshot:${def.id}`,
      collisionFilter: { category: CAT.BUMPER }
    });
  }

  hit(ballBody: Matter.Body) {
    Matter.Body.applyForce(ballBody, ballBody.position, {
      x: this.pushDir.x * KICK_FORCE,
      y: this.pushDir.y * KICK_FORCE
    });
    this.flash = 1;
  }

  update(dt: number) {
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt / 180);
  }
}
