import type { LevelDef } from "./types";

export const level1: LevelDef = {
  id: 1,
  title: "Ion Storm",
  subtitle: "Light all three beacons",
  theme: {
    name: "ion-storm",
    playfield: "#0a1230",
    playfieldAccent: "#101c47",
    rail: "#1c2a5e",
    glow: "#39e6ff",
    accentA: "#39e6ff",
    accentB: "#7cf9d0",
    accentC: "#ff5fd1",
    starfield: true
  },
  bumpers: [
    { id: "b1", pos: { x: 250, y: 250 }, radius: 27, score: 100 },
    { id: "b2", pos: { x: 172, y: 372 }, radius: 27, score: 100 },
    { id: "b3", pos: { x: 328, y: 372 }, radius: 27, score: 100 }
  ],
  rollovers: [
    { id: "r1", pos: { x: 118, y: 172 }, score: 500, label: "TOP", skillShot: true },
    { id: "r2", pos: { x: 382, y: 172 }, score: 500, label: "TOP" }
  ],
  objective: { type: "light-bumpers", target: 3, label: "Light all 3 beacons" }
};
