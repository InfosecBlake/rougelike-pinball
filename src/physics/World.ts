import Matter from "matter-js";
import { PHYSICS } from "../core/constants";

export class PhysicsWorld {
  engine: Matter.Engine;
  world: Matter.World;

  constructor() {
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: PHYSICS.gravity }
    });
    this.world = this.engine.world;
    // Pinball needs a crisp, stable solver — a couple of extra iterations
    // keeps fast balls from tunnelling through thin flipper/wall geometry.
    this.engine.positionIterations = 10;
    this.engine.velocityIterations = 12;
  }

  add(...bodies: (Matter.Body | Matter.Constraint)[]) {
    Matter.World.add(this.world, bodies as Matter.Body[]);
  }

  remove(body: Matter.Body | Matter.Constraint) {
    Matter.World.remove(this.world, body as any);
  }

  clear() {
    Matter.World.clear(this.world, false);
    Matter.Engine.clear(this.engine);
  }

  step(deltaMs: number) {
    Matter.Engine.update(this.engine, deltaMs);
  }
}
