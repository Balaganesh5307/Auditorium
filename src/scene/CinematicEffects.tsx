import type { CameraState } from './CameraController';

interface CinematicEffectsProps {
  cameraState: CameraState;
  selectedTablePosition: [number, number, number] | null;
}

// Depth-of-field removed for performance and clarity
export default function CinematicEffects(_props: CinematicEffectsProps) {
  return null;
}
