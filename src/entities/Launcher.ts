import type { Vec2 } from "../levels/types";

const MAX_CHARGE_MS = 900;
const MIN_LAUNCH_VELOCITY = 14;
const MAX_LAUNCH_VELOCITY = 34;

export class Launcher {
  laneX: number;
  restY: number;
  charging = false;
  charge = 0; // 0..1
  private chargeStart = 0;

  constructor(pos: Vec2) {
    this.laneX = pos.x;
    this.restY = pos.y;
  }

  startCharge(now: number) {
    if (this.charging) return;
    this.charging = true;
    this.chargeStart = now;
  }

  update(now: number) {
    if (this.charging) {
      const elapsed = now - this.chargeStart;
      this.charge = Math.min(1, elapsed / MAX_CHARGE_MS);
    }
  }

  release(): number {
    const power = this.charge;
    this.charging = false;
    this.charge = 0;
    return MIN_LAUNCH_VELOCITY + power * (MAX_LAUNCH_VELOCITY - MIN_LAUNCH_VELOCITY);
  }
}
