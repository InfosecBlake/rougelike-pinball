import type { LevelDef } from "./types";

export const level2: LevelDef = {
  id: 2,
  title: "Crimson Vault",
  subtitle: "Drop the vault bank twice",
  theme: {
    name: "crimson-vault",
    playfield: "#1a0710",
    playfieldAccent: "#2c0b1a",
    rail: "#4a1024",
    glow: "#ff3b6e",
    accentA: "#ff3b6e",
    accentB: "#ffb454",
    accentC: "#7cf9d0",
    starfield: false
  },
  bumpers: [
    { id: "b1", pos: { x: 150, y: 300 }, radius: 25, score: 120 },
    { id: "b2", pos: { x: 350, y: 300 }, radius: 25, score: 120 }
  ],
  dropBank: {
    id: "vault",
    bonus: 3000,
    targets: [
      { id: "t1", pos: { x: 190, y: 470 } },
      { id: "t2", pos: { x: 250, y: 460 } },
      { id: "t3", pos: { x: 310, y: 470 } }
    ]
  },
  rollovers: [
    { id: "r1", pos: { x: 118, y: 172 }, score: 500, label: "TOP", skillShot: true },
    { id: "r2", pos: { x: 382, y: 172 }, score: 500, label: "TOP" }
  ],
  objective: { type: "clear-drop-targets", target: 2, label: "Clear the vault bank 2 times" }
};
