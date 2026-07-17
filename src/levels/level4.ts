import type { LevelDef } from "./types";

export const level4: LevelDef = {
  id: 4,
  title: "Violet Cascade",
  subtitle: "Run the ramp 5 times",
  theme: {
    name: "violet-cascade",
    playfield: "#160a2e",
    playfieldAccent: "#241141",
    rail: "#3c1c66",
    glow: "#b969ff",
    accentA: "#b969ff",
    accentB: "#ff5fd1",
    accentC: "#39e6ff",
    starfield: true
  },
  bumpers: [
    { id: "b1", pos: { x: 170, y: 330 }, radius: 25, score: 130 },
    { id: "b2", pos: { x: 250, y: 470 }, radius: 25, score: 130 }
  ],
  ramp: {
    id: "spire",
    entry: { x: 392, y: 610 },
    entryRadius: 24,
    path: [
      { x: 392, y: 610 },
      { x: 416, y: 470 },
      { x: 404, y: 300 },
      { x: 300, y: 188 },
      { x: 190, y: 176 }
    ],
    exit: { x: 190, y: 176 },
    exitVelocity: { x: -3.2, y: 2.4 },
    minEntrySpeed: 8.5,
    score: 800,
    label: "SPIRE RAMP"
  },
  rollovers: [{ id: "r1", pos: { x: 118, y: 172 }, score: 500, label: "TOP", skillShot: true }],
  objective: { type: "run-ramp", target: 5, label: "Run the spire ramp 5 times" }
};
