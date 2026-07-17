export interface Vec2 {
  x: number;
  y: number;
}

export type ObjectiveType =
  | "light-bumpers"
  | "clear-drop-targets"
  | "spin-spinner"
  | "run-ramp"
  | "grand-finale"
  | "dungeon-keeper";

export interface Objective {
  type: ObjectiveType;
  target: number;
  label: string;
}

export interface BumperDef {
  id: string;
  pos: Vec2;
  radius?: number;
  score: number;
}

export interface SlingshotDef {
  id: string;
  points: [Vec2, Vec2, Vec2];
  score: number;
  pushDir: Vec2;
}

export interface SpinnerDef {
  id: string;
  pos: Vec2;
  length?: number;
  angle: number;
  score: number;
}

export interface DropTargetDef {
  id: string;
  pos: Vec2;
  width?: number;
  height?: number;
  angle?: number;
}

export interface DropTargetBankDef {
  id: string;
  targets: DropTargetDef[];
  bonus: number;
  rewardLabel?: string;
}

export interface RolloverDef {
  id: string;
  pos: Vec2;
  radius?: number;
  score: number;
  skillShot?: boolean;
  label: string;
  lit?: boolean;
}

export interface RampDef {
  id: string;
  entry: Vec2;
  entryRadius?: number;
  path: Vec2[];
  exit: Vec2;
  exitVelocity: Vec2;
  minEntrySpeed: number;
  score: number;
  label: string;
}

/** A standup target never drops or disables collision — it just tracks a lit state once hit. */
export interface StandupTargetDef {
  id: string;
  pos: Vec2;
  width?: number;
  height?: number;
  angle?: number;
}

export type StandupRole = "arrow" | "lock" | "standup";

export interface StandupBankDef {
  id: string;
  role: StandupRole;
  targets: StandupTargetDef[];
  score: number;
  /** Lock banks start disabled until another feature (e.g. the arrow bank) enables them. */
  enabled?: boolean;
}

export interface LevelTheme {
  name: string;
  playfield: string;
  playfieldAccent: string;
  rail: string;
  glow: string;
  accentA: string;
  accentB: string;
  accentC: string;
  starfield: boolean;
}

export interface LevelDef {
  id: number;
  title: string;
  subtitle: string;
  theme: LevelTheme;
  bumpers: BumperDef[];
  spinner?: SpinnerDef;
  dropBanks?: DropTargetBankDef[];
  ramps?: RampDef[];
  standupBanks?: StandupBankDef[];
  /** A special large bumper-style boss target, separate from the regular bumpers array. */
  keeper?: BumperDef;
  /** id of the rollover in `rollovers` that acts as the multiball-release gate (starts unlit). */
  gateId?: string;
  rollovers: RolloverDef[];
  objective: Objective;
}
