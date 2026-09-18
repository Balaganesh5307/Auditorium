/**
 * Physical layout for the 2nd half of the auditorium.
 *
 * The 2nd half packs 30 team slots into 20 physical table spots
 * across 3 physical rows.  Some tables are "shared" — two teams
 * sit at one physical table, visually split by a diagonal line.
 */

export interface PhysicalTableSlot {
  type: 'single' | 'shared';
  /** Physical row index within the 2nd half (0, 1, 2) */
  physicalRow: number;
  /** Column index within that physical row */
  physicalCol: number;
  /** Primary team table ID (bottom-left for shared) */
  teamA: string;
  /** Secondary team table ID (top-right for shared, undefined for single) */
  teamB?: string;
}

/**
 * The exact layout from the reference image.
 *
 * Row 0 (7 slots): [F1/F2] [F3/F4] [F5/F6] [G1] [G2] [G3] [G4/G5]
 * Row 1 (6 slots): [G6/H1] [H2/H3] [H4/H5] [H6/I1] [I2/I3] [I4/I5]
 * Row 2 (7 slots): [I6] [J1] [J2] [J3] [J4] [J5] [J6]
 */
export const SECOND_HALF_LAYOUT: PhysicalTableSlot[] = [
  // ── Physical Row 0  (7 slots, 11 teams) ──
  { type: 'shared', physicalRow: 0, physicalCol: 0, teamA: 'F1', teamB: 'F2' },
  { type: 'shared', physicalRow: 0, physicalCol: 1, teamA: 'F3', teamB: 'F4' },
  { type: 'shared', physicalRow: 0, physicalCol: 2, teamA: 'F5', teamB: 'F6' },
  { type: 'single', physicalRow: 0, physicalCol: 3, teamA: 'G1' },
  { type: 'single', physicalRow: 0, physicalCol: 4, teamA: 'G2' },
  { type: 'single', physicalRow: 0, physicalCol: 5, teamA: 'G3' },
  { type: 'shared', physicalRow: 0, physicalCol: 6, teamA: 'G4', teamB: 'G5' },

  // ── Physical Row 1  (6 slots, 12 teams) ──
  { type: 'shared', physicalRow: 1, physicalCol: 0, teamA: 'G6', teamB: 'H1' },
  { type: 'shared', physicalRow: 1, physicalCol: 1, teamA: 'H2', teamB: 'H3' },
  { type: 'shared', physicalRow: 1, physicalCol: 2, teamA: 'H4', teamB: 'H5' },
  { type: 'shared', physicalRow: 1, physicalCol: 3, teamA: 'H6', teamB: 'I1' },
  { type: 'shared', physicalRow: 1, physicalCol: 4, teamA: 'I2', teamB: 'I3' },
  { type: 'shared', physicalRow: 1, physicalCol: 5, teamA: 'I4', teamB: 'I5' },

  // ── Physical Row 2  (7 slots, 7 teams) ──
  { type: 'single', physicalRow: 2, physicalCol: 0, teamA: 'I6' },
  { type: 'single', physicalRow: 2, physicalCol: 1, teamA: 'J1' },
  { type: 'single', physicalRow: 2, physicalCol: 2, teamA: 'J2' },
  { type: 'single', physicalRow: 2, physicalCol: 3, teamA: 'J3' },
  { type: 'single', physicalRow: 2, physicalCol: 4, teamA: 'J4' },
  { type: 'single', physicalRow: 2, physicalCol: 5, teamA: 'J5' },
  { type: 'single', physicalRow: 2, physicalCol: 6, teamA: 'J6' },
];

/** Number of physical columns in each 2nd-half row */
export const SECOND_HALF_ROW_COLS = [7, 6, 7];

/** Total physical rows in the 2nd half */
export const SECOND_HALF_PHYSICAL_ROWS = 3;

/**
 * Build a lookup: teamId → PhysicalTableSlot
 * so we can quickly find a team's physical position from its ID.
 */
export function buildTeamToSlotMap(): Map<string, PhysicalTableSlot> {
  const map = new Map<string, PhysicalTableSlot>();
  for (const slot of SECOND_HALF_LAYOUT) {
    map.set(slot.teamA, slot);
    if (slot.teamB) {
      map.set(slot.teamB, slot);
    }
  }
  return map;
}

/**
 * Get the partner table ID for a given table ID if it's in a shared slot.
 * Returns undefined if the table is a single-occupancy slot or not in the 2nd half.
 */
export function getSharedPartner(tableId: string): string | undefined {
  for (const slot of SECOND_HALF_LAYOUT) {
    if (slot.type !== 'shared') continue;
    if (slot.teamA === tableId) return slot.teamB;
    if (slot.teamB === tableId) return slot.teamA;
  }
  return undefined;
}

/** Set of all 2nd-half team IDs */
export const SECOND_HALF_TEAM_IDS = new Set(
  SECOND_HALF_LAYOUT.flatMap((s) => (s.teamB ? [s.teamA, s.teamB] : [s.teamA]))
);
