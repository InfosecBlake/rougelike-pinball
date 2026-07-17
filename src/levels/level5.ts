import type { LevelDef } from "./types";

export const level5: LevelDef = {
  id: 5,
  title: "Dragon's Hoard",
  subtitle: "Plunder 15,000 gold to wake the dragon",
  theme: {
    name: "dragons-hoard",
    playfield: "#0a0605",
    playfieldAccent: "#1f0f08",
    rail: "#4a2410",
    glow: "#ffd23f",
    accentA: "#ffd23f",
    accentB: "#ff5a3d",
    accentC: "#b969ff",
    starfield: true
  },
  bumpers: [
    { id: "b1", pos: { x: 250, y: 210 }, radius: 22, score: 150 },
    { id: "b2", pos: { x: 160, y: 300 }, radius: 22, score: 150 },
    { id: "b3", pos: { x: 340, y: 300 }, radius: 22, score: 150 }
  ],
  spinner: {
    id: "hoard-wheel",
    pos: { x: 250, y: 430 },
    length: 80,
    angle: -0.45,
    score: 90
  },
  dropBanks: [
    {
      id: "vault-wall",
      bonus: 4000,
      targets: [
        { id: "t1", pos: { x: 170, y: 590 } },
        { id: "t2", pos: { x: 230, y: 580 } },
        { id: "t3", pos: { x: 290, y: 590 } }
      ]
    }
  ],
  ramps: [
    {
      id: "dragon-stair",
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
      label: "VAULT STAIRS"
    }
  ],
  rollovers: [
    { id: "r1", pos: { x: 118, y: 172 }, score: 600, label: "RUNE", skillShot: true },
    { id: "r2", pos: { x: 382, y: 172 }, score: 600, label: "RUNE" }
  ],
  objective: { type: "grand-finale", target: 15000, label: "Plunder 15,000 gold to wake the dragon" }
};
