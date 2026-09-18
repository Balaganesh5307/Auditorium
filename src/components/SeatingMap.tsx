import { useMemo, useCallback, memo } from 'react';
import TableModel from '../scene/TableModel';
import SharedTableModel from '../scene/SharedTableModel';
import { Text } from '@react-three/drei';
import type { TeamsMap } from '../data/teams';
import {
  SECOND_HALF_LAYOUT,
  SECOND_HALF_ROW_COLS,
  SECOND_HALF_TEAM_IDS,
  getSharedPartner,
} from '../data/sharedLayout';

const DEFAULT_ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const DEFAULT_COLS = [1, 2, 3, 4, 5, 6];

interface SeatingMapProps {
  selectedTableId: string | null;
  onTableSelect: (tableId: string) => void;
  rows?: string[];
  cols?: number[];
  teams?: TeamsMap;
}

// Layout constants — spacious table gaps & middle walkway aisle split
export const COL_SPACING = 5.5;
export const ROW_SPACING = 4.8;
export const HORIZ_AISLE_GAP = 6.5;
export const ROW_LABEL_OFFSET = 5.2;

/**
 * Compute the 3D position for a table in the FIRST half (standard grid).
 * The first half uses rows A–E (indices 0–4) out of 10 total rows.
 */
export function getTablePositionDynamic(
  row: string,
  col: number,
  rows: string[] = DEFAULT_ROWS,
  cols: number[] = DEFAULT_COLS
): [number, number, number] {
  const safeRows = rows || DEFAULT_ROWS;
  const safeCols = cols || DEFAULT_COLS;

  const rowIndex = safeRows.indexOf(row);
  const colIndex = col - 1;

  const totalCols = safeCols.length;
  const totalRows = safeRows.length;

  const centerOffset = (totalCols - 1) / 2;
  const x = (colIndex - centerOffset) * COL_SPACING;

  let z = (rowIndex - (totalRows - 1) / 2) * ROW_SPACING;

  // Split rows into 2 halves with a big walkway gap in the middle
  if (totalRows > 1) {
    const rowMidpoint = Math.floor(totalRows / 2) - 1;
    if (rowIndex <= rowMidpoint) {
      z -= HORIZ_AISLE_GAP / 2;
    } else {
      z += HORIZ_AISLE_GAP / 2;
    }
  }

  return [x, 0, z];
}

/**
 * Compute position for a physical table slot in the 2nd half custom layout.
 * Left-aligned: all rows start from the same X as the 1st half's column 1.
 */
function getSecondHalfPosition(
  physicalRow: number,
  physicalCol: number,
  _colsInRow: number,
  firstHalfRows: string[],
  totalRows: string[],
): [number, number, number] {
  // Left-align: start from the same X as the 1st half's first column
  // 1st half col 1 X = (0 - (totalCols-1)/2) * COL_SPACING
  // For 6 columns: (0 - 2.5) * 5.5 = -13.75
  const firstColX = -(DEFAULT_COLS.length - 1) / 2 * COL_SPACING;
  const x = firstColX + physicalCol * COL_SPACING;

  // Z position: continue after the first half with the aisle gap
  const totalRowsLen = totalRows.length;
  const secondHalfStartRowIndex = firstHalfRows.length;
  const baseRowIndex = secondHalfStartRowIndex + physicalRow;
  let z = (baseRowIndex - (totalRowsLen - 1) / 2) * ROW_SPACING;
  z += HORIZ_AISLE_GAP / 2;

  return [x, 0, z];
}

// First half rows (A–E)
const FIRST_HALF_ROWS = ['A', 'B', 'C', 'D', 'E'];

// Memoized column numbers component — displays numbers 1, 2, 3... above Row A only
const ColumnHeaders = memo(function ColumnHeaders({ rows, cols }: { rows: string[]; cols: number[] }) {
  const safeRows = rows || DEFAULT_ROWS;
  const safeCols = cols || DEFAULT_COLS;
  if (safeRows.length === 0 || safeCols.length === 0) return null;

  // Row A is the first row
  const rowA = safeRows[0];
  const [, , zRowA] = getTablePositionDynamic(rowA, 1, safeRows, safeCols);
  const zAboveA = zRowA - 3.8;

  return (
    <>
      {/* Column numbers above Row A only */}
      {safeCols.map((col) => {
        const [x] = getTablePositionDynamic(rowA, col, safeRows, safeCols);
        return (
          <Text
            key={`col-a-${col}`}
            position={[x, 0.08, zAboveA]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={1.9}
            color="#C00020"
            fillOpacity={0.88}
            anchorX="center"
            anchorY="middle"
          >
            {col}
          </Text>
        );
      })}
    </>
  );
});

// Row labels for the 2nd half physical rows
const SECOND_HALF_ROW_LABELS = ['F-G', 'G-I', 'I-J'];

// Memoized row labels component — displays alphabet letters on the left side
const RowLabels = memo(function RowLabels({ rows, cols }: { rows: string[]; cols: number[] }) {
  // Compute the fixed label X position from the 1st half (same for all rows)
  const [leftTableX] = getTablePositionDynamic(FIRST_HALF_ROWS[0], 1, rows, cols);
  const fixedLabelX = leftTableX - ROW_LABEL_OFFSET;

  return (
    <>
      {/* First half row labels (A–E) */}
      {FIRST_HALF_ROWS.filter((r) => rows.includes(r)).map((row) => {
        const [, , z] = getTablePositionDynamic(row, 1, rows, cols);

        return (
          <Text
            key={row}
            position={[fixedLabelX, 0.08, z]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={2.2}
            color="#C00020"
            fillOpacity={0.88}
            anchorX="center"
            anchorY="middle"
          >
            {row}
          </Text>
        );
      })}

      {/* Second half row labels (F-G, G-I, I-J) — same X as 1st half */}
      {SECOND_HALF_ROW_LABELS.map((label, physRow) => {
        const colsInRow = SECOND_HALF_ROW_COLS[physRow];
        const [, , z] = getSecondHalfPosition(
          physRow,
          0,
          colsInRow,
          FIRST_HALF_ROWS,
          rows,
        );

        return (
          <Text
            key={`2nd-${physRow}`}
            position={[fixedLabelX, 0.08, z]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={1.8}
            color="#C00020"
            fillOpacity={0.88}
            anchorX="center"
            anchorY="middle"
          >
            {label}
          </Text>
        );
      })}
    </>
  );
});

const SeatingMap = memo(function SeatingMap({
  selectedTableId,
  onTableSelect,
  rows = DEFAULT_ROWS,
  cols = DEFAULT_COLS,
  teams = {},
}: SeatingMapProps) {
  const safeRows = rows || DEFAULT_ROWS;
  const safeCols = cols || DEFAULT_COLS;
  const safeTeams = teams || {};

  // ── 1st Half: Standard grid (rows A–E) ──
  const firstHalfLayout = useMemo(() => {
    const result: { id: string; position: [number, number, number] }[] = [];
    for (const row of FIRST_HALF_ROWS) {
      if (!safeRows.includes(row)) continue;
      for (const col of safeCols) {
        const id = `${row}${col}`;
        result.push({ id, position: getTablePositionDynamic(row, col, safeRows, safeCols) });
      }
    }
    return result;
  }, [safeRows, safeCols]);

  // ── 2nd Half: Custom layout with shared tables ──
  const secondHalfLayout = useMemo(() => {
    const singles: { id: string; position: [number, number, number] }[] = [];
    const shareds: {
      teamA: string;
      teamB: string;
      position: [number, number, number];
    }[] = [];

    for (const slot of SECOND_HALF_LAYOUT) {
      const colsInRow = SECOND_HALF_ROW_COLS[slot.physicalRow];
      const pos = getSecondHalfPosition(
        slot.physicalRow,
        slot.physicalCol,
        colsInRow,
        FIRST_HALF_ROWS,
        safeRows,
      );

      if (slot.type === 'single') {
        singles.push({ id: slot.teamA, position: pos });
      } else if (slot.teamB) {
        shareds.push({ teamA: slot.teamA, teamB: slot.teamB, position: pos });
      }
    }
    return { singles, shareds };
  }, [safeRows, safeCols]);

  const handleTableClick = useCallback(
    (tableId: string) => {
      onTableSelect(tableId);
    },
    [onTableSelect]
  );

  // Check if a given table is selected (considering shared table partners)
  const isTableSelected = useCallback(
    (tableId: string) => {
      if (!selectedTableId) return false;
      if (selectedTableId === tableId) return true;
      // If the selected table's partner is this table, also highlight it
      const partner = getSharedPartner(selectedTableId);
      return partner === tableId;
    },
    [selectedTableId]
  );

  return (
    <group position={[0, 0, 2]}>
      {/* ── 1st Half: Standard Tables ── */}
      {firstHalfLayout.map(({ id, position }) => {
        const teamData = safeTeams[id];
        if (!teamData) return null;
        return (
          <TableModel
            key={id}
            tableId={id}
            position={position}
            isSelected={selectedTableId === id}
            onClick={handleTableClick}
            teamName={teamData.teamName || id}
          />
        );
      })}

      {/* ── 2nd Half: Single Tables ── */}
      {secondHalfLayout.singles.map(({ id, position }) => {
        const teamData = safeTeams[id];
        if (!teamData) return null;
        return (
          <TableModel
            key={id}
            tableId={id}
            position={position}
            isSelected={selectedTableId === id}
            onClick={handleTableClick}
            teamName={teamData.teamName || id}
          />
        );
      })}

      {/* ── 2nd Half: Shared/Diagonal Tables ── */}
      {secondHalfLayout.shareds.map(({ teamA, teamB, position }) => {
        const teamDataA = safeTeams[teamA];
        const teamDataB = safeTeams[teamB];
        if (!teamDataA && !teamDataB) return null;
        return (
          <SharedTableModel
            key={`${teamA}-${teamB}`}
            tableIdA={teamA}
            tableIdB={teamB}
            position={position}
            isSelected={isTableSelected(teamA) || isTableSelected(teamB)}
            selectedTeamId={selectedTableId}
            onClick={handleTableClick}
            teamNameA={teamDataA?.teamName || teamA}
            teamNameB={teamDataB?.teamName || teamB}
          />
        );
      })}

      {/* Column numbers above Row A */}
      <ColumnHeaders rows={safeRows} cols={safeCols} />

      {/* Row labels */}
      <RowLabels rows={safeRows} cols={safeCols} />
    </group>
  );
});

export default SeatingMap;

/**
 * Utility: get the physical 3D position for ANY table ID
 * (used by App.tsx for camera targeting).
 */
export function getTablePosition(
  tableId: string,
  rows: string[] = DEFAULT_ROWS,
  cols: number[] = DEFAULT_COLS
): [number, number, number] {
  // Check if this table is in the 2nd half custom layout
  if (SECOND_HALF_TEAM_IDS.has(tableId)) {
    for (const slot of SECOND_HALF_LAYOUT) {
      if (slot.teamA === tableId || slot.teamB === tableId) {
        const colsInRow = SECOND_HALF_ROW_COLS[slot.physicalRow];
        return getSecondHalfPosition(
          slot.physicalRow,
          slot.physicalCol,
          colsInRow,
          FIRST_HALF_ROWS,
          rows,
        );
      }
    }
  }

  // Standard first-half grid lookup
  const row = tableId.charAt(0);
  const col = parseInt(tableId.substring(1));
  return getTablePositionDynamic(row, col, rows, cols);
}
