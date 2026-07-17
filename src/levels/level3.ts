import type { LevelDef } from "./types";

export const level3: LevelDef = {
  id: 3,
  title: "Solar Drift",
  subtitle: "Spin the gate 15 times",
  theme: {
    name: "solar-drift",
    playfield: "#2a1403",
    playfieldAccent: "#3d1c05",
    rail: "#5c2c08",
    glow: "#ffb027",
    accentA: "#ffb027",
    accentB: "#ff6b3d",
    accentC: "#39e6ff",
    starfield: false
  },
  bumpers: [
    { id: "b1", pos: { x: 250, y: 230 }, radius: 26, score: 110 },
    { id: "b2", pos: { x: 150, y: 560 }, radius: 24, score: 110 },
    { id: "b3", pos: { x: 350, y: 560 }, radius: 24, score: 110 }
  ],
  spinner: {
    id: "gate",
    pos: { x: 250, y: 400 },
    length: 84,
    angle: -0.5,
    score: 75
  },
  rollovers: [
    { id: "r1", pos: { x: 118, y: 172 }, score: 500, label: "TOP", skillShot: true },
    { id: "r2", pos: { x: 382, y: 172 }, score: 500, label: "TOP" }
  ],
  objective: { type: "spin-spinner", target: 15, label: "Spin the gate 15 times" }
};
