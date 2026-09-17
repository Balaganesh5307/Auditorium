import { useRef, useState, useCallback, memo } from 'react';
import * as THREE from 'three';
import ChairModel from './ChairModel';
import TableCard from './TableCard';

// ── Shared geometry — created once, used by all 60 tables ──
const TABLE_TOP_GEO = new THREE.BoxGeometry(2.0, 0.06, 1.15);
const TABLE_LEG_GEO = new THREE.CylinderGeometry(0.035, 0.035, 0.75, 8);
const TABLE_EDGE_GEO = new THREE.BoxGeometry(2.02, 0.02, 1.17);

// ── Shared materials — static, never recreated ──
const MAT_TOP_DEFAULT = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4, metalness: 0.05 });
const MAT_TOP_HOVER = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.25, metalness: 0.05 });
const MAT_TOP_SELECTED = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.35, metalness: 0.05 });

const MAT_LEG_DEFAULT = new THREE.MeshStandardMaterial({ color: '#e0e0e0', roughness: 0.5, metalness: 0.1 });
const MAT_LEG_HOVER = new THREE.MeshStandardMaterial({ color: '#d5d5d5', roughness: 0.5, metalness: 0.1 });
const MAT_LEG_SELECTED = new THREE.MeshStandardMaterial({ color: '#e0e0e0', roughness: 0.5, metalness: 0.1 });

const MAT_EDGE_DEFAULT = new THREE.MeshStandardMaterial({ color: '#d0d0d0', roughness: 0.3, metalness: 0.1 });
const MAT_EDGE_ACTIVE = new THREE.MeshStandardMaterial({ color: '#C00020', roughness: 0.3, metalness: 0.1 });

// ── Static positions (never changes) ──
const LEG_POSITIONS: [number, number, number][] = [
  [-0.82, 0.375, -0.45],
  [0.82, 0.375, -0.45],
  [-0.82, 0.375, 0.45],
  [0.82, 0.375, 0.45],
];

const CHAIR_CONFIGS = [
  { pos: [-0.55, 0, 0.85] as [number, number, number], rot: [0, Math.PI, 0] as [number, number, number] },
  { pos: [0.55, 0, 0.85] as [number, number, number], rot: [0, Math.PI, 0] as [number, number, number] },
  { pos: [-0.55, 0, -0.85] as [number, number, number], rot: [0, 0, 0] as [number, number, number] },
  { pos: [0.55, 0, -0.85] as [number, number, number], rot: [0, 0, 0] as [number, number, number] },
];

interface TableModelProps {
  tableId: string;
  position: [number, number, number];
  isSelected: boolean;
  onClick: (tableId: string) => void;
  teamName: string;
}

const TableModel = memo(function TableModel({ tableId, position, isSelected, onClick, teamName }: TableModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Pick from shared static materials — zero allocation
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
      onClick(tableId);
    },
    [onClick, tableId]
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
      <mesh geometry={TABLE_TOP_GEO} material={topMat} position={[0, 0.78, 0]} castShadow receiveShadow />

      {/* Table edge trim */}
      <mesh geometry={TABLE_EDGE_GEO} material={edgeMat} position={[0, 0.75, 0]} />

      {/* Legs */}
      {LEG_POSITIONS.map((pos, i) => (
        <mesh key={i} geometry={TABLE_LEG_GEO} material={legMat} position={pos} />
      ))}

      {/* Chairs */}
      {CHAIR_CONFIGS.map((cfg, i) => (
        <ChairModel key={i} position={cfg.pos} rotation={cfg.rot} />
      ))}

      {/* Table nameplate/card */}
      <TableCard
        tableId={tableId}
        teamName={teamName || tableId}
        isSelected={isSelected}
      />
    </group>
  );
});

export default TableModel;
