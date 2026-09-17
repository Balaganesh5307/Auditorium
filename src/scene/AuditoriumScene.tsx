import { memo } from 'react';
import { Canvas } from '@react-three/fiber';
import Lighting from './Lighting';
import CameraController from './CameraController';
import type { CameraState } from './CameraController';
import Auditorium from '../components/Auditorium';
import CinematicEffects from './CinematicEffects';
import SeatingMap from '../components/SeatingMap';
import type { TeamsMap } from '../data/teams';

const DEFAULT_ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const DEFAULT_COLS = [1, 2, 3, 4, 5];

interface AuditoriumSceneProps {
  cameraState: CameraState;
  shutterOpen: boolean;
  selectedTableId: string | null;
  selectedTablePosition: [number, number, number] | null;
  onTableSelect: (tableId: string) => void;
  onTransitionComplete?: () => void;
  rows?: string[];
  cols?: number[];
  teams?: TeamsMap;
}

const AuditoriumScene = memo(function AuditoriumScene({
  cameraState,
  selectedTableId,
  selectedTablePosition,
  onTableSelect,
  onTransitionComplete,
  rows = DEFAULT_ROWS,
  cols = DEFAULT_COLS,
  teams = {},
}: AuditoriumSceneProps) {
  const safeRows = rows || DEFAULT_ROWS;
  const safeCols = cols || DEFAULT_COLS;
  const safeTeams = teams || {};
  return (
    <Canvas
      shadows
      camera={{ fov: 60, near: 0.1, far: 200, position: [0, 2, 24] }}
      className={`scene-canvas ${selectedTableId ? 'table-view' : ''}`}
      gl={{
        antialias: false,
        toneMapping: 3,
        toneMappingExposure: 1.4,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 1]}
    >
      <color attach="background" args={['#fdfdfd']} />

      <Lighting />

      <CinematicEffects
        cameraState={cameraState}
        selectedTablePosition={selectedTablePosition}
      />

      <CameraController
        cameraState={cameraState}
        selectedTablePosition={selectedTablePosition}
        onTransitionComplete={onTransitionComplete}
        rows={safeRows}
        cols={safeCols}
      />

      <Auditorium rows={safeRows} cols={safeCols} />

      <SeatingMap
        selectedTableId={selectedTableId}
        onTableSelect={onTableSelect}
        rows={safeRows}
        cols={safeCols}
        teams={safeTeams}
      />
    </Canvas>
  );
});

export default AuditoriumScene;
