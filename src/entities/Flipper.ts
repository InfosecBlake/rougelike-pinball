import Matter from "matter-js";
import { CAT } from "../core/constants";
import type { Vec2 } from "../levels/types";

export type FlipperSide = "left" | "right";

/**
 * A flipper is a rectangle body pinned at its pivot via a constraint, then
 * driven toward a target angle every tick by directly setting angular
 * velocity. This keeps Matter's own collision response (and thus ball
 * impulse transfer) correct while still giving us snappy, arcade-y control.
 */
export class Flipper {
  body: Matter.Body;
  constraint: Matter.Constraint;
  pivot: Vec2;
  restAngle: number;
  upAngle: number;
  side: FlipperSide;
  pressed = false;
  length: number;

  constructor(pivot: Vec2, length: number, thickness: number, restAngle: number, upAngle: number, side: FlipperSide) {
    this.pivot = pivot;
    this.restAngle = restAngle;
    this.upAngle = upAngle;
    this.side = side;
    this.length = length;

    const dir = side === "left" ? 1 : -1;
    const centerOffset = (dir * length) / 2;
    const cx = pivot.x + centerOffset * Math.cos(restAngle);
    const cy = pivot.y + centerOffset * Math.sin(restAngle);

    this.body = Matter.Bodies.rectangle(cx, cy, length, thickness, {
      angle: restAngle,
      chamfer: { radius: thickness / 2 },
      friction: 0.15,
      restitution: 0.05,
      density: 0.004,
      collisionFilter: { category: CAT.FLIPPER },
      label: `flipper-${side}`
    });
    Matter.Body.setInertia(this.body, this.body.inertia * 0.4);

    this.constraint = Matter.Constraint.create({
      pointA: pivot,
      bodyB: this.body,
      pointB: { x: -centerOffset, y: 0 },
      length: 0,
      stiffness: 1,
      damping: 0.4
    });
  }

  get bodies(): (Matter.Body | Matter.Constraint)[] {
    return [this.body, this.constraint];
  }

  setPressed(pressed: boolean) {
    this.pressed = pressed;
  }

  update() {
    const target = this.pressed ? this.upAngle : this.restAngle;
    const current = this.body.angle;
    const diff = target - current;
    const maxSpeed = 0.62; // rad per step, tuned for snappy but stable response
    const responsiveness = 10;
    let angularVelocity = diff * responsiveness;
    if (angularVelocity > maxSpeed) angularVelocity = maxSpeed;
    if (angularVelocity < -maxSpeed) angularVelocity = -maxSpeed;
    Matter.Body.setAngularVelocity(this.body, angularVelocity);
  }
}
