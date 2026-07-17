import type { LevelDef } from "./types";

export const level1: LevelDef = {
  id: 1,
  title: "Goblin Warrens",
  subtitle: "Light all 3 torches",
  theme: {
    name: "goblin-warrens",
    playfield: "#0d1608",
    playfieldAccent: "#182410",
    rail: "#33481c",
    glow: "#ff9c3d",
    accentA: "#ff9c3d",
    accentB: "#8ee666",
    accentC: "#e8dcc8",
    starfield: false
  },
  bumpers: [
    { id: "b1", pos: { x: 250, y: 250 }, radius: 27, score: 100 },
    { id: "b2", pos: { x: 172, y: 372 }, radius: 27, score: 100 },
    { id: "b3", pos: { x: 328, y: 372 }, radius: 27, score: 100 }
  ],
  rollovers: [
    { id: "r1", pos: { x: 118, y: 172 }, score: 500, label: "RUNE", skillShot: true },
    { id: "r2", pos: { x: 382, y: 172 }, score: 500, label: "RUNE" }
  ],
  objective: { type: "light-bumpers", target: 3, label: "Light all 3 torches" }
};
