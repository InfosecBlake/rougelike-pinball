import type { LevelDef } from "./types";

export const level3: LevelDef = {
  id: 3,
  title: "Molten Forge",
  subtitle: "Spin the furnace wheel 15 times",
  theme: {
    name: "molten-forge",
    playfield: "#2a1403",
    playfieldAccent: "#3d1c05",
    rail: "#5c2c08",
    glow: "#ff7a1a",
    accentA: "#ff7a1a",
    accentB: "#ffcf5c",
    accentC: "#7a8a99",
    starfield: true
  },
  bumpers: [
    { id: "b1", pos: { x: 250, y: 230 }, radius: 26, score: 110 },
    { id: "b2", pos: { x: 150, y: 560 }, radius: 24, score: 110 },
    { id: "b3", pos: { x: 350, y: 560 }, radius: 24, score: 110 }
  ],
  spinner: {
    id: "furnace-wheel",
    pos: { x: 250, y: 400 },
    length: 84,
    angle: -0.5,
    score: 75
  },
  rollovers: [
    { id: "r1", pos: { x: 118, y: 172 }, score: 500, label: "RUNE", skillShot: true },
    { id: "r2", pos: { x: 382, y: 172 }, score: 500, label: "RUNE" }
  ],
  objective: { type: "spin-spinner", target: 15, label: "Spin the furnace wheel 15 times" }
};
