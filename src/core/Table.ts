import Matter from "matter-js";
import type { LevelDef } from "../levels/types";
import { PhysicsWorld } from "../physics/World";
import { wallChain } from "../physics/geometry";
import {
  outerBoundary,
  laneDivider,
  laneFloor,
  rightOutlaneGuide,
  leftInlaneGuide,
  LEFT_FLIPPER_PIVOT,
  RIGHT_FLIPPER_PIVOT,
  FLIPPER_LENGTH,
  FLIPPER_THICKNESS,
  LEFT_FLIPPER_REST,
  LEFT_FLIPPER_UP,
  RIGHT_FLIPPER_REST,
  RIGHT_FLIPPER_UP,
  DRAIN_Y,
  DRAIN_LEFT,
  DRAIN_RIGHT,
  LAUNCHER_BALL_START,
  slingshotDefs
} from "../physics/TableShell";
import { CAT } from "../core/constants";
import { Flipper } from "../entities/Flipper";
import { Bumper } from "../entities/Bumper";
import { Slingshot } from "../entities/Slingshot";
import { Spinner } from "../entities/Spinner";
import { DropTargetBank } from "../entities/DropTargetBank";
import { StandupBank } from "../entities/StandupBank";
import { Ramp } from "../entities/Ramp";
import { Rollover } from "../entities/Rollover";
import { Launcher } from "../entities/Launcher";

/** Builds every physics body + game entity for one level, and tears it all down again on level change. */
export class Table {
  def: LevelDef;
  leftFlipper: Flipper;
  rightFlipper: Flipper;
  bumpers: Bumper[] = [];
  keeper: Bumper | null = null;
  slingshots: Slingshot[] = [];
  spinner: Spinner | null = null;
  dropBanks: DropTargetBank[] = [];
  standupBanks: StandupBank[] = [];
  ramps: Ramp[] = [];
  rollovers: Rollover[] = [];
  launcher: Launcher;
  drainSensor: Matter.Body;
  private staticBodies: Matter.Body[] = [];
  private world: PhysicsWorld;

  constructor(world: PhysicsWorld, def: LevelDef) {
    this.world = world;
    this.def = def;

    const wallBodies = [
      ...wallChain(outerBoundary(), 14),
      ...wallChain(laneDivider(), 12),
      ...wallChain(laneFloor(), 14),
      ...wallChain(rightOutlaneGuide(), 12),
      ...wallChain(leftInlaneGuide(), 10)
    ];
    this.staticBodies.push(...wallBodies);

    this.drainSensor = Matter.Bodies.rectangle(
      (DRAIN_LEFT + DRAIN_RIGHT) / 2,
      DRAIN_Y,
      DRAIN_RIGHT - DRAIN_LEFT,
      24,
      { isStatic: true, isSensor: true, label: "drain", collisionFilter: { category: CAT.SENSOR } }
    );
    this.staticBodies.push(this.drainSensor);

    this.leftFlipper = new Flipper(LEFT_FLIPPER_PIVOT, FLIPPER_LENGTH, FLIPPER_THICKNESS, LEFT_FLIPPER_REST, LEFT_FLIPPER_UP, "left");
    this.rightFlipper = new Flipper(RIGHT_FLIPPER_PIVOT, FLIPPER_LENGTH, FLIPPER_THICKNESS, RIGHT_FLIPPER_REST, RIGHT_FLIPPER_UP, "right");

    for (const sd of slingshotDefs()) {
      const s = new Slingshot(sd);
      this.slingshots.push(s);
      this.staticBodies.push(s.body);
    }

    for (const bd of def.bumpers) {
      const b = new Bumper(bd);
      this.bumpers.push(b);
      this.staticBodies.push(b.body);
    }

    if (def.keeper) {
      this.keeper = new Bumper(def.keeper);
      this.staticBodies.push(this.keeper.body);
    }

    if (def.spinner) {
      this.spinner = new Spinner(def.spinner);
      this.staticBodies.push(this.spinner.body);
    }

    for (const dbd of def.dropBanks ?? []) {
      const bank = new DropTargetBank(dbd);
      this.dropBanks.push(bank);
      this.staticBodies.push(...bank.bodies);
    }

    for (const sbd of def.standupBanks ?? []) {
      const bank = new StandupBank(sbd);
      this.standupBanks.push(bank);
      this.staticBodies.push(...bank.bodies);
    }

    for (const rd of def.ramps ?? []) {
      const ramp = new Ramp(rd);
      this.ramps.push(ramp);
      this.staticBodies.push(ramp.entrySensor);
    }

    for (const rd of def.rollovers) {
      const r = new Rollover(rd);
      this.rollovers.push(r);
      this.staticBodies.push(r.body);
    }

    this.launcher = new Launcher(LAUNCHER_BALL_START);

    world.add(...this.staticBodies, this.leftFlipper.body, this.leftFlipper.constraint, this.rightFlipper.body, this.rightFlipper.constraint);
  }

  update(dt: number, now: number) {
    this.leftFlipper.update();
    this.rightFlipper.update();
    for (const b of this.bumpers) b.update(dt);
    this.keeper?.update(dt);
    for (const s of this.slingshots) s.update(dt);
    this.spinner?.update(dt);
    for (const bank of this.dropBanks) bank.update(dt);
    for (const bank of this.standupBanks) bank.update(dt);
    for (const ramp of this.ramps) ramp.update(dt);
    for (const r of this.rollovers) r.update(dt);
    this.launcher.update(now);
  }

  destroy() {
    this.world.remove(this.leftFlipper.constraint);
    this.world.remove(this.rightFlipper.constraint);
    for (const body of [...this.staticBodies, this.leftFlipper.body, this.rightFlipper.body]) {
      this.world.remove(body);
    }
  }
}
