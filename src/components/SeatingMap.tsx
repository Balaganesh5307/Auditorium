import { useMemo, useCallback, memo } from 'react';
import TableModel from '../scene/TableModel';
import { Text } from '@react-three/drei';
import type { TeamsMap } from '../data/teams';

const DEFAULT_ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const DEFAULT_COLS = [1, 2, 3, 4, 5];

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

// Memoized row labels component — only re-renders when rows/cols change
const RowLabels = memo(function RowLabels({ rows, cols }: { rows: string[]; cols: number[] }) {
  return (
    <>
      {rows.map((row) => {
        const [leftTableX, , z] = getTablePositionDynamic(row, 1, rows, cols);
        const [rightTableX] = getTablePositionDynamic(row, cols[cols.length - 1], rows, cols);

        const leftX = leftTableX - ROW_LABEL_OFFSET;
        const rightX = rightTableX + ROW_LABEL_OFFSET;

        return (
          <group key={row}>
            {/* Left side row letter */}
            <Text
              position={[leftX, 0.08, z]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={2.2}
              color="#C00020"
              anchorX="center"
              anchorY="middle"
            >
              {row}
            </Text>
            {/* Right side row letter */}
            <Text
              position={[rightX, 0.08, z]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={2.2}
              color="#C00020"
              anchorX="center"
              anchorY="middle"
            >
              {row}
            </Text>
          </group>
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

  // Compute table IDs and positions — only recomputes when rows/cols change
  const tableLayout = useMemo(() => {
    const result: { id: string; position: [number, number, number] }[] = [];
    for (const row of safeRows) {
      for (const col of safeCols) {
        const id = `${row}${col}`;
        result.push({ id, position: getTablePositionDynamic(row, col, safeRows, safeCols) });
      }
    }
    return result;
  }, [safeRows, safeCols]);

  const handleTableClick = useCallback(
    (tableId: string) => {
      onTableSelect(tableId);
    },
    [onTableSelect]
  );

  return (
    <group position={[0, 0, 2]}>
      {tableLayout.map(({ id, position }) => {
        const teamData = safeTeams[id];
        // Only render tables that exist in the teams data
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

      {/* Row labels */}
      <RowLabels rows={safeRows} cols={safeCols} />
    </group>
  );
});

export default SeatingMap;
