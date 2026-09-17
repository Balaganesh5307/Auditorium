import { memo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

// ── Shared Materials matching Auditorium Stage & Room styling ──
const MAT_MGMT_TOP = new THREE.MeshStandardMaterial({
  color: '#ffffff',
  roughness: 0.35,
  metalness: 0.08,
});

const MAT_RED_TRIM = new THREE.MeshStandardMaterial({
  color: '#C00020',
  emissive: '#C00020',
  emissiveIntensity: 0.35,
});

export interface ManagementTableProps {
  x: number;
  z: number;
  width: number;
  depth: number;
}

const ManagementTable = memo(function ManagementTable({
  x,
  z,
  width,
  depth,
}: ManagementTableProps) {
  const boxHeight = 0.5; // Raised box platform like the stage
  const halfW = width / 2;
  const halfD = depth / 2;

  return (
    <group position={[x, 0, z]}>
      {/* ── Floor Base Border (matching Room 1 & Room 2 floor perimeter) ── */}
      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[width + 0.16, 0.02, depth + 0.16]} />
        <primitive object={MAT_RED_TRIM} attach="material" />
      </mesh>

      {/* ── Main Solid Box Platform (matching Stage platform) ── */}
      <mesh position={[0, boxHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, boxHeight, depth]} />
        <primitive object={MAT_MGMT_TOP} attach="material" />
      </mesh>

      {/* ── Red Accent Lines Framing Top Edges (matching Stage red accent line) ── */}
      {/* Aisle-facing edge */}
      <mesh position={[halfW - 0.02, boxHeight + 0.005, 0]}>
        <boxGeometry args={[0.06, 0.015, depth]} />
        <primitive object={MAT_RED_TRIM} attach="material" />
      </mesh>
      {/* Wall-facing edge */}
      <mesh position={[-halfW + 0.02, boxHeight + 0.005, 0]}>
        <boxGeometry args={[0.06, 0.015, depth]} />
        <primitive object={MAT_RED_TRIM} attach="material" />
      </mesh>
      {/* North edge (Row A side) */}
      <mesh position={[0, boxHeight + 0.005, -halfD + 0.02]}>
        <boxGeometry args={[width, 0.015, 0.06]} />
        <primitive object={MAT_RED_TRIM} attach="material" />
      </mesh>
      {/* South edge (Window side) */}
      <mesh position={[0, boxHeight + 0.005, halfD - 0.02]}>
        <boxGeometry args={[width, 0.015, 0.06]} />
        <primitive object={MAT_RED_TRIM} attach="material" />
      </mesh>

      {/* ── Bold Top-Down Text Label (Rotated 90° to fit along the box's long axis) ── */}
      <Text
        position={[0, boxHeight + 0.02, 0]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        fontSize={0.65}
        color="#C00020"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.14}
        fontWeight="bold"
      >
        MANAGEMENT TABLE
      </Text>

      {/* Aisle-facing vertical face label */}
      <Text
        position={[halfW + 0.01, boxHeight / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        fontSize={0.22}
        color="#111111"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.12}
      >
        MANAGEMENT TABLE
      </Text>
    </group>
  );
});

export default ManagementTable;
