import Matter from "matter-js";
import { BALL_RADIUS, CAT, PHYSICS } from "../core/constants";

export interface TrailPoint {
  x: number;
  y: number;
  age: number;
}

export class Ball {
  body: Matter.Body;
  trail: TrailPoint[] = [];
  alive = true;
  /** When set, the ball is being animated along a ramp path instead of simulated by physics. */
  captured: { rampId: string; t: number; duration: number } | null = null;
  litSkillShot = false;

  constructor(x: number, y: number) {
    this.body = Matter.Bodies.circle(x, y, BALL_RADIUS, {
      restitution: PHYSICS.ballRestitution,
      friction: PHYSICS.ballFriction,
      frictionAir: PHYSICS.ballFrictionAir,
      density: 0.0012,
      label: "ball",
      collisionFilter: { category: CAT.BALL },
      slop: 0.01
    });
  }

  updateTrail() {
    this.trail.unshift({ x: this.body.position.x, y: this.body.position.y, age: 0 });
    if (this.trail.length > 10) this.trail.pop();
    for (const p of this.trail) p.age++;
  }

  get position() {
    return this.body.position;
  }

  get speed() {
    return Matter.Vector.magnitude(this.body.velocity);
  }
}
