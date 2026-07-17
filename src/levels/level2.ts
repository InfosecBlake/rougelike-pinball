import type { LevelDef } from "./types";

export const level2: LevelDef = {
  id: 2,
  title: "Crimson Crypt",
  subtitle: "Shatter the bone wall twice",
  theme: {
    name: "crimson-crypt",
    playfield: "#1a0710",
    playfieldAccent: "#2c0b1a",
    rail: "#4a1024",
    glow: "#e63950",
    accentA: "#e63950",
    accentB: "#e8dcc8",
    accentC: "#ffb347",
    starfield: false
  },
  bumpers: [
    { id: "b1", pos: { x: 150, y: 300 }, radius: 25, score: 120 },
    { id: "b2", pos: { x: 350, y: 300 }, radius: 25, score: 120 }
  ],
  dropBank: {
    id: "bone-wall",
    bonus: 3000,
    targets: [
      { id: "t1", pos: { x: 190, y: 470 } },
      { id: "t2", pos: { x: 250, y: 460 } },
      { id: "t3", pos: { x: 310, y: 470 } }
    ]
  },
  rollovers: [
    { id: "r1", pos: { x: 118, y: 172 }, score: 500, label: "RUNE", skillShot: true },
    { id: "r2", pos: { x: 382, y: 172 }, score: 500, label: "RUNE" }
  ],
  objective: { type: "clear-drop-targets", target: 2, label: "Shatter the bone wall 2 times" }
};
