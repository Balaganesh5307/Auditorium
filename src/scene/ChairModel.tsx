import { memo } from 'react';
import * as THREE from 'three';

// Shared geometry & materials — created once, reused across all chair instances
const CHAIR_SEAT_GEO = new THREE.BoxGeometry(0.42, 0.04, 0.42);
const CHAIR_BACK_GEO = new THREE.BoxGeometry(0.42, 0.44, 0.04);
const CHAIR_LEG_GEO = new THREE.CylinderGeometry(0.018, 0.018, 0.35, 6);
const CHAIR_MAT = new THREE.MeshStandardMaterial({
  color: '#080808',
  roughness: 0.6,
  metalness: 0.1,
});
const CHAIR_BACK_MAT = new THREE.MeshStandardMaterial({
  color: '#111111',
  roughness: 0.5,
  metalness: 0.05,
});

// PERF: Static constant — no need for useMemo with [] deps.
// The old useMemo ran the array factory on every mount and stored
// a cleanup closure, which is pure overhead for a value that never changes.
const LEG_POSITIONS: [number, number, number][] = [
  [-0.17, -0.175 + 0.19, -0.17],
  [0.17, -0.175 + 0.19, -0.17],
  [-0.17, -0.175 + 0.19, 0.17],
  [0.17, -0.175 + 0.19, 0.17],
];

interface ChairModelProps {
  position: [number, number, number];
  rotation?: [number, number, number];
}

const ChairModel = memo(function ChairModel({ position, rotation = [0, 0, 0] }: ChairModelProps) {
  return (
    <group position={position} rotation={rotation}>
      {/* Seat */}
      <mesh geometry={CHAIR_SEAT_GEO} material={CHAIR_MAT} position={[0, 0.37, 0]} />

      {/* Chair back */}
      <mesh geometry={CHAIR_BACK_GEO} material={CHAIR_BACK_MAT} position={[0, 0.59, -0.19]} />

      {/* Legs */}
      {LEG_POSITIONS.map((pos, i) => (
        <mesh key={i} geometry={CHAIR_LEG_GEO} material={CHAIR_MAT} position={pos} />
      ))}
    </group>
  );
});

export default ChairModel;
