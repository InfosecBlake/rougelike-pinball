// Table is a portrait pinball playfield, in physics/pixel units.
export const TABLE_WIDTH = 520;
export const TABLE_HEIGHT = 940;

// Collision categories (Matter.js bitmasks)
export const CAT = {
  BALL: 0x0001,
  WALL: 0x0002,
  FLIPPER: 0x0004,
  BUMPER: 0x0008,
  SENSOR: 0x0010,
  TARGET: 0x0020,
  GATE: 0x0040
} as const;

export const BALL_RADIUS = 10.5;

export const PHYSICS = {
  gravity: 1.55,
  ballRestitution: 0.42,
  ballFriction: 0.02,
  ballFrictionAir: 0.0008,
  wallRestitution: 0.35,
  fixedTimestepMs: 1000 / 120
};

export const COLORS = {
  bg: "#05030d"
};

export const STORAGE_KEYS = {
  highScore: "neon-pinball.highscore"
};

export const BALLS_PER_GAME = 3;
export const BALL_SAVE_MS = 8000;
export const SKILL_SHOT_WINDOW_MS = 4500;
export const TILT_DECAY_PER_MS = 1 / 4200; // meter drains fully in ~4.2s of no nudging
export const TILT_WARNING_AT = 0.72;
export const NUDGE_TILT_ADD = 0.3;
