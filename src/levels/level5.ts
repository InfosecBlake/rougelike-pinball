import type { LevelDef } from "./types";

export const level5: LevelDef = {
  id: 5,
  title: "Nova Core",
  subtitle: "Score 15,000 to overload the core",
  theme: {
    name: "nova-core",
    playfield: "#08040a",
    playfieldAccent: "#170a1f",
    rail: "#341845",
    glow: "#ffffff",
    accentA: "#ffffff",
    accentB: "#39e6ff",
    accentC: "#ff5fd1",
    starfield: true
  },
  bumpers: [
    { id: "b1", pos: { x: 250, y: 210 }, radius: 22, score: 150 },
    { id: "b2", pos: { x: 160, y: 300 }, radius: 22, score: 150 },
    { id: "b3", pos: { x: 340, y: 300 }, radius: 22, score: 150 }
  ],
  spinner: {
    id: "core-gate",
    pos: { x: 250, y: 430 },
    length: 80,
    angle: -0.45,
    score: 90
  },
  dropBank: {
    id: "core-bank",
    bonus: 4000,
    targets: [
      { id: "t1", pos: { x: 170, y: 590 } },
      { id: "t2", pos: { x: 230, y: 580 } },
      { id: "t3", pos: { x: 290, y: 590 } }
    ]
  },
  ramp: {
    id: "overload-ramp",
    entry: { x: 400, y: 600 },
    entryRadius: 24,
    path: [
      { x: 400, y: 600 },
      { x: 420, y: 470 },
      { x: 408, y: 300 },
      { x: 300, y: 190 },
      { x: 190, y: 176 }
    ],
    exit: { x: 190, y: 176 },
    exitVelocity: { x: -3, y: 2.2 },
    minEntrySpeed: 8.5,
    score: 900,
    label: "OVERLOAD RAMP"
  },
  rollovers: [
    { id: "r1", pos: { x: 118, y: 172 }, score: 600, label: "TOP", skillShot: true },
    { id: "r2", pos: { x: 382, y: 172 }, score: 600, label: "TOP" }
  ],
  objective: { type: "grand-finale", target: 15000, label: "Score 15,000 points to overload the core" }
};
