import { TABLE_WIDTH, TABLE_HEIGHT } from "../core/constants";
import type { Vec2, SlingshotDef } from "../levels/types";

// Shared structural geometry used by every table: outer boundary, plunger
// lane, flipper pivots, slingshots, outlanes and the drain. Individual
// levels only add their own bumpers/spinner/targets/ramp on top of this.

export const FIELD_LEFT = 40;
export const FIELD_RIGHT = 460; // also the inner lane-divider x
export const OUTER_RIGHT = 500; // table's absolute right edge (lane wall)
export const TOP_ARC_Y = 90;
export const BOTTOM_Y = 905;

export const LANE_TOP_GAP_Y = 128; // divider stops here so the lane opens into the field

export const LEFT_FLIPPER_PIVOT: Vec2 = { x: 178, y: 838 };
export const RIGHT_FLIPPER_PIVOT: Vec2 = { x: 342, y: 838 };
export const FLIPPER_LENGTH = 96;
export const FLIPPER_THICKNESS = 20;

// Rest angle = flippers hang down/outward; up angle = raised toward center.
export const LEFT_FLIPPER_REST = Math.PI * 0.28;
export const LEFT_FLIPPER_UP = -Math.PI * 0.34;
export const RIGHT_FLIPPER_REST = Math.PI - Math.PI * 0.28;
export const RIGHT_FLIPPER_UP = Math.PI + Math.PI * 0.34;

export const DRAIN_Y = 924;
export const DRAIN_LEFT = 66;
export const DRAIN_RIGHT = 454;

export const LAUNCHER_LANE_X = (FIELD_RIGHT + OUTER_RIGHT) / 2; // 480
export const LAUNCHER_BALL_START: Vec2 = { x: LAUNCHER_LANE_X, y: 860 };

function arcPoints(cx: number, cy: number, rx: number, ry: number, startDeg: number, endDeg: number, steps: number): Vec2[] {
  const pts: Vec2[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = startDeg + ((endDeg - startDeg) * i) / steps;
    const rad = (t * Math.PI) / 180;
    pts.push({ x: cx + rx * Math.cos(rad), y: cy + ry * Math.sin(rad) });
  }
  return pts;
}

/** Outer boundary of the whole table, left-outlane -> up -> across the top arc -> down the lane -> lane floor. */
export function outerBoundary(): Vec2[] {
  return [
    { x: 96, y: BOTTOM_Y },
    { x: FIELD_LEFT, y: 760 },
    { x: FIELD_LEFT, y: TOP_ARC_Y },
    ...arcPoints((FIELD_LEFT + OUTER_RIGHT) / 2, TOP_ARC_Y, (OUTER_RIGHT - FIELD_LEFT) / 2, 78, 180, 360, 14),
    { x: OUTER_RIGHT, y: TOP_ARC_Y },
    { x: OUTER_RIGHT, y: BOTTOM_Y }
  ];
}

/** Inner divider separating the plunger lane from the main field. Open above LANE_TOP_GAP_Y. */
export function laneDivider(): Vec2[] {
  return [
    { x: FIELD_RIGHT, y: BOTTOM_Y },
    { x: FIELD_RIGHT, y: LANE_TOP_GAP_Y }
  ];
}

export function laneFloor(): Vec2[] {
  return [
    { x: FIELD_RIGHT, y: BOTTOM_Y },
    { x: OUTER_RIGHT, y: BOTTOM_Y }
  ];
}

export function rightOutlaneGuide(): Vec2[] {
  return [
    { x: FIELD_RIGHT, y: 700 },
    { x: 402, y: 828 }
  ];
}

export function leftInlaneGuide(): Vec2[] {
  return [
    { x: 150, y: 700 },
    { x: 118, y: 800 }
  ];
}

export function slingshotDefs(): SlingshotDef[] {
  return [
    {
      id: "sling-left",
      points: [
        { x: 120, y: 760 },
        { x: 160, y: 690 },
        { x: 206, y: 772 }
      ],
      score: 60,
      pushDir: { x: 0.5, y: -0.9 }
    },
    {
      id: "sling-right",
      points: [
        { x: 380, y: 760 },
        { x: 340, y: 690 },
        { x: 294, y: 772 }
      ],
      score: 60,
      pushDir: { x: -0.5, y: -0.9 }
    }
  ];
}

export const TABLE_BOUNDS = { width: TABLE_WIDTH, height: TABLE_HEIGHT };
