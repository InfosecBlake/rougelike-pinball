import type { LevelDef } from "./types";

export const level1: LevelDef = {
  id: 1,
  title: "Dungeon Depths",
  subtitle: "Awaken the Dungeon Keeper",
  theme: {
    name: "dungeon-depths",
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
    { id: "b1", pos: { x: 175, y: 255 }, radius: 24, score: 100 },
    { id: "b2", pos: { x: 250, y: 225 }, radius: 24, score: 100 },
    { id: "b3", pos: { x: 325, y: 255 }, radius: 24, score: 100 }
  ],
  keeper: { id: "keeper", pos: { x: 85, y: 175 }, radius: 22, score: 250 },
  standupBanks: [
    {
      id: "arrows",
      role: "arrow",
      score: 150,
      targets: [
        { id: "a1", pos: { x: 140, y: 320 }, width: 16, height: 12 },
        { id: "a2", pos: { x: 190, y: 320 }, width: 16, height: 12 },
        { id: "a3", pos: { x: 240, y: 320 }, width: 16, height: 12 },
        { id: "a4", pos: { x: 290, y: 320 }, width: 16, height: 12 },
        { id: "a5", pos: { x: 340, y: 320 }, width: 16, height: 12 }
      ]
    },
    {
      id: "locks",
      role: "lock",
      score: 300,
      enabled: false,
      targets: [
        { id: "l1", pos: { x: 205, y: 375 }, width: 20, height: 14 },
        { id: "l2", pos: { x: 250, y: 375 }, width: 20, height: 14 },
        { id: "l3", pos: { x: 295, y: 375 }, width: 20, height: 14 }
      ]
    },
    {
      id: "left-standups",
      role: "standup",
      score: 100,
      targets: [
        { id: "s1", pos: { x: 90, y: 420 }, width: 14, height: 14 },
        { id: "s2", pos: { x: 90, y: 455 }, width: 14, height: 14 },
        { id: "s3", pos: { x: 90, y: 490 }, width: 14, height: 14 }
      ]
    }
  ],
  dropBanks: [
    {
      id: "treasure-bank",
      bonus: 2500,
      rewardLabel: "TREASURE FOUND",
      targets: [
        { id: "t1", pos: { x: 110, y: 540 }, width: 26, height: 12 },
        { id: "t2", pos: { x: 140, y: 540 }, width: 26, height: 12 }
      ]
    },
    {
      id: "spell-bank",
      bonus: 2500,
      rewardLabel: "SPELL LEARNED",
      targets: [
        { id: "t1", pos: { x: 235, y: 530 }, width: 26, height: 12 },
        { id: "t2", pos: { x: 265, y: 530 }, width: 26, height: 12 }
      ]
    },
    {
      id: "weapon-bank",
      bonus: 2500,
      rewardLabel: "WEAPON FORGED",
      targets: [
        { id: "t1", pos: { x: 335, y: 535 }, width: 26, height: 12 },
        { id: "t2", pos: { x: 365, y: 535 }, width: 26, height: 12 }
      ]
    }
  ],
  ramps: [
    {
      id: "dungeon-entrance",
      entry: { x: 250, y: 605 },
      entryRadius: 22,
      path: [
        { x: 250, y: 605 },
        { x: 260, y: 480 },
        { x: 230, y: 330 },
        { x: 180, y: 240 },
        { x: 130, y: 225 }
      ],
      exit: { x: 130, y: 225 },
      exitVelocity: { x: -2.2, y: 2 },
      minEntrySpeed: 8,
      score: 700,
      label: "DUNGEON ENTRANCE"
    },
    {
      id: "keeper-ramp",
      entry: { x: 415, y: 545 },
      entryRadius: 20,
      path: [
        { x: 415, y: 545 },
        { x: 430, y: 420 },
        { x: 410, y: 280 },
        { x: 320, y: 190 },
        { x: 220, y: 165 }
      ],
      exit: { x: 220, y: 165 },
      exitVelocity: { x: -2.8, y: 2.2 },
      minEntrySpeed: 8,
      score: 700,
      label: "TO THE KEEPER"
    }
  ],
  rollovers: [
    { id: "left-loop", pos: { x: 150, y: 190 }, radius: 11, score: 500, label: "LEFT LOOP", skillShot: true },
    { id: "right-orbit", pos: { x: 380, y: 190 }, radius: 11, score: 500, label: "RIGHT ORBIT" },
    { id: "gate", pos: { x: 250, y: 150 }, radius: 12, score: 200, label: "GATE", lit: false }
  ],
  gateId: "gate",
  objective: { type: "dungeon-keeper", target: 10, label: "Awaken the Dungeon Keeper" }
};
