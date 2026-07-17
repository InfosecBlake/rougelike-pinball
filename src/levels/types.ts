export interface Vec2 {
  x: number;
  y: number;
}

export type ObjectiveType =
  | "light-bumpers"
  | "clear-drop-targets"
  | "spin-spinner"
  | "run-ramp"
  | "grand-finale";

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
}

export interface RolloverDef {
  id: string;
  pos: Vec2;
  radius?: number;
  score: number;
  skillShot?: boolean;
  label: string;
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
  dropBank?: DropTargetBankDef;
  ramp?: RampDef;
  rollovers: RolloverDef[];
  objective: Objective;
}
