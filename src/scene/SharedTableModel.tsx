import { useRef, useState, useCallback, memo } from 'react';
import * as THREE from 'three';
import ChairModel from './ChairModel';
import { Text } from '@react-three/drei';

// ── Shared geometry — wider table for 2 teams ──
const SHARED_TABLE_TOP_GEO = new THREE.BoxGeometry(2.4, 0.06, 1.15);
const SHARED_TABLE_EDGE_GEO = new THREE.BoxGeometry(2.42, 0.02, 1.17);
const TABLE_LEG_GEO = new THREE.CylinderGeometry(0.035, 0.035, 0.75, 8);

// Diagonal divider — flat thin strip on table surface
const DIAGONAL_LENGTH = Math.sqrt(2.4 * 2.4 + 1.15 * 1.15);
const DIAGONAL_LINE_GEO = new THREE.BoxGeometry(DIAGONAL_LENGTH, 0.004, 0.018);
const DIAGONAL_ANGLE = Math.atan2(1.15, 2.4);

// ── Name card geometry (same style as single TableCard but smaller to fit in triangle) ──
const CARD_GEO = new THREE.BoxGeometry(0.72, 0.05, 0.45);
const STAND_GEO = new THREE.BoxGeometry(0.02, 0.18, 0.28);
const TOP_ACCENT_GEO = new THREE.BoxGeometry(0.72, 0.008, 0.06);
const SELECTED_FACE_GEO = new THREE.BoxGeometry(0.72, 0.008, 0.45);

// ── Shared materials ──
const MAT_TOP_DEFAULT = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4, metalness: 0.05 });
const MAT_TOP_HOVER = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.25, metalness: 0.05 });
const MAT_TOP_SELECTED = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.35, metalness: 0.05 });

const MAT_LEG_DEFAULT = new THREE.MeshStandardMaterial({ color: '#e0e0e0', roughness: 0.5, metalness: 0.1 });
const MAT_LEG_HOVER = new THREE.MeshStandardMaterial({ color: '#d5d5d5', roughness: 0.5, metalness: 0.1 });
const MAT_LEG_SELECTED = new THREE.MeshStandardMaterial({ color: '#e0e0e0', roughness: 0.5, metalness: 0.1 });

const MAT_EDGE_DEFAULT = new THREE.MeshStandardMaterial({ color: '#d0d0d0', roughness: 0.3, metalness: 0.1 });
const MAT_EDGE_ACTIVE = new THREE.MeshStandardMaterial({ color: '#C00020', roughness: 0.3, metalness: 0.1 });

const MAT_DIAGONAL = new THREE.MeshStandardMaterial({ color: '#bbbbbb', roughness: 0.3, metalness: 0.05 });
const CARD_MAT = new THREE.MeshStandardMaterial({ color: '#fdfdfd', roughness: 0.3, metalness: 0.05 });
const RED_MAT = new THREE.MeshStandardMaterial({ color: '#C00020', roughness: 0.3 });

// ── Leg positions for wider table ──
const LEG_POSITIONS: [number, number, number][] = [
  [-1.02, 0.375, -0.45],
  [1.02, 0.375, -0.45],
  [-1.02, 0.375, 0.45],
  [1.02, 0.375, 0.45],
];

// 8 chairs: 2 front, 2 back, 2 left, 2 right
const CHAIR_CONFIGS = [
  { pos: [-0.55, 0, 0.85] as [number, number, number], rot: [0, Math.PI, 0] as [number, number, number] },
  { pos: [0.55, 0, 0.85] as [number, number, number], rot: [0, Math.PI, 0] as [number, number, number] },
  { pos: [-0.55, 0, -0.85] as [number, number, number], rot: [0, 0, 0] as [number, number, number] },
  { pos: [0.55, 0, -0.85] as [number, number, number], rot: [0, 0, 0] as [number, number, number] },
  { pos: [-1.45, 0, -0.25] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number] },
  { pos: [-1.45, 0, 0.25] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number] },
  { pos: [1.45, 0, -0.25] as [number, number, number], rot: [0, -Math.PI / 2, 0] as [number, number, number] },
  { pos: [1.45, 0, 0.25] as [number, number, number], rot: [0, -Math.PI / 2, 0] as [number, number, number] },
];

interface SharedTableModelProps {
  tableIdA: string;
  tableIdB: string;
  position: [number, number, number];
  isSelected: boolean;
  selectedTeamId: string | null;
  onClick: (tableId: string) => void;
  teamNameA: string;
  teamNameB: string;
}

const SharedTableModel = memo(function SharedTableModel({
  tableIdA,
  tableIdB,
  position,
  isSelected,
  onClick,
  teamNameA,
  teamNameB,
}: SharedTableModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);

  const topMat = isSelected ? MAT_TOP_SELECTED : isHovered ? MAT_TOP_HOVER : MAT_TOP_DEFAULT;
  const legMat = isSelected ? MAT_LEG_SELECTED : isHovered ? MAT_LEG_HOVER : MAT_LEG_DEFAULT;
  const edgeMat = isSelected || isHovered ? MAT_EDGE_ACTIVE : MAT_EDGE_DEFAULT;

  const handlePointerOver = useCallback((e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setIsHovered(true);
    document.body.style.cursor = 'pointer';
  }, []);

  const handlePointerOut = useCallback(() => {
    setIsHovered(false);
    document.body.style.cursor = 'default';
  }, []);

  const handleClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      onClick(tableIdA);
    },
    [onClick, tableIdA]
  );

  const scale = isHovered && !isSelected ? 1.05 : 1;

  return (
    <group
      ref={groupRef}
      position={position}
      scale={[scale, scale, scale]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {/* Table top */}
      <mesh geometry={SHARED_TABLE_TOP_GEO} material={topMat} position={[0, 0.78, 0]} castShadow receiveShadow />

      {/* Table edge trim */}
      <mesh geometry={SHARED_TABLE_EDGE_GEO} material={edgeMat} position={[0, 0.75, 0]} />

      {/* Diagonal divider line */}
      <mesh
        geometry={DIAGONAL_LINE_GEO}
        material={MAT_DIAGONAL}
        position={[0, 0.812, 0]}
        rotation={[0, DIAGONAL_ANGLE, 0]}
      />

      {/* Legs */}
      {LEG_POSITIONS.map((pos, i) => (
        <mesh key={i} geometry={TABLE_LEG_GEO} material={legMat} position={pos} />
      ))}

      {/* 8 Chairs */}
      {CHAIR_CONFIGS.map((cfg, i) => (
        <ChairModel key={i} position={cfg.pos} rotation={cfg.rot} />
      ))}

      {/* ═══ Team A — Raised card in top-left triangle area ═══ */}
      <group position={[-0.55, 0.82, -0.15]}>
        {/* Card base */}
        <mesh geometry={CARD_GEO} material={CARD_MAT} position={[0, 0.12, 0]} castShadow />
        {/* Accent / selected highlight */}
        {isSelected ? (
          <mesh geometry={SELECTED_FACE_GEO} material={RED_MAT} position={[0, 0.148, 0]} />
        ) : (
          <mesh geometry={TOP_ACCENT_GEO} material={RED_MAT} position={[0, 0.148, -0.175]} />
        )}
        {/* Stand / fold */}
        <mesh geometry={STAND_GEO} material={CARD_MAT} position={[0, 0.04, -0.16]} rotation={[0.3, 0, 0]} />
        {/* Table ID */}
        <Text
          position={[0, 0.16, 0.03]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.13}
          color={isSelected ? '#ffffff' : '#111111'}
          anchorX="center"
          anchorY="middle"
          maxWidth={0.65}
        >
          {tableIdA}
        </Text>
        {/* Team name */}
        <Text
          position={[0, 0.16, 0.15]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.055}
          color={isSelected ? '#ffffff' : '#333333'}
          anchorX="center"
          anchorY="middle"
          maxWidth={0.65}
        >
          {teamNameA}
        </Text>
        {/* BUILDATHON label */}
        <Text
          position={[0, 0.16, -0.1]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.032}
          color={isSelected ? '#ffffff' : '#C00020'}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.15}
        >
          BUILDATHON 2026
        </Text>
      </group>

      {/* ═══ Team B — Raised card in bottom-right triangle area ═══ */}
      <group position={[0.55, 0.82, 0.15]}>
        {/* Card base */}
        <mesh geometry={CARD_GEO} material={CARD_MAT} position={[0, 0.12, 0]} castShadow />
        {/* Accent / selected highlight */}
        {isSelected ? (
          <mesh geometry={SELECTED_FACE_GEO} material={RED_MAT} position={[0, 0.148, 0]} />
        ) : (
          <mesh geometry={TOP_ACCENT_GEO} material={RED_MAT} position={[0, 0.148, -0.175]} />
        )}
        {/* Stand / fold */}
        <mesh geometry={STAND_GEO} material={CARD_MAT} position={[0, 0.04, -0.16]} rotation={[0.3, 0, 0]} />
        {/* Table ID */}
        <Text
          position={[0, 0.16, 0.03]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.13}
          color={isSelected ? '#ffffff' : '#111111'}
          anchorX="center"
          anchorY="middle"
          maxWidth={0.65}
        >
          {tableIdB}
        </Text>
        {/* Team name */}
        <Text
          position={[0, 0.16, 0.15]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.055}
          color={isSelected ? '#ffffff' : '#333333'}
          anchorX="center"
          anchorY="middle"
          maxWidth={0.65}
        >
          {teamNameB}
        </Text>
        {/* BUILDATHON label */}
        <Text
          position={[0, 0.16, -0.1]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.032}
          color={isSelected ? '#ffffff' : '#C00020'}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.15}
        >
          BUILDATHON 2026
        </Text>
      </group>
    </group>
  );
});

export default SharedTableModel;
