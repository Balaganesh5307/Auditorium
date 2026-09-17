import { memo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

// ── Shared geometry & materials — created once, reused across all TableCard instances ──
const CARD_GEO = new THREE.BoxGeometry(0.95, 0.05, 0.6);
const STAND_GEO = new THREE.BoxGeometry(0.02, 0.2, 0.35);
const TOP_ACCENT_GEO = new THREE.BoxGeometry(0.95, 0.008, 0.08);
const SELECTED_FACE_GEO = new THREE.BoxGeometry(0.95, 0.008, 0.6);

const CARD_MAT = new THREE.MeshStandardMaterial({ color: '#fdfdfd', roughness: 0.3, metalness: 0.05 });
const RED_MAT = new THREE.MeshStandardMaterial({ color: '#C00020', roughness: 0.3 });

interface TableCardProps {
  teamName: string;
  tableId: string;
  isSelected: boolean;
}

const TableCard = memo(function TableCard({ teamName, tableId, isSelected }: TableCardProps) {
  return (
    <group position={[0, 0.82, 0]}>
      {/* Card base */}
      <mesh geometry={CARD_GEO} material={CARD_MAT} position={[0, 0.12, 0]} castShadow />

      {/* When selected: full red face. When unselected: top red accent strip */}
      {isSelected ? (
        <mesh geometry={SELECTED_FACE_GEO} material={RED_MAT} position={[0, 0.148, 0]} />
      ) : (
        <mesh geometry={TOP_ACCENT_GEO} material={RED_MAT} position={[0, 0.148, -0.24]} />
      )}

      {/* Stand / fold */}
      <mesh geometry={STAND_GEO} material={CARD_MAT} position={[0, 0.05, -0.22]} rotation={[0.3, 0, 0]} />

      {/* Table ID text on card */}
      <Text
        position={[0, 0.16, 0.06]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.14}
        color={isSelected ? '#ffffff' : '#111111'}
        anchorX="center"
        anchorY="middle"
        maxWidth={0.85}
      >
        {tableId}
      </Text>

      {/* Team name */}
      <Text
        position={[0, 0.16, 0.21]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.065}
        color={isSelected ? '#ffffff' : '#333333'}
        anchorX="center"
        anchorY="middle"
        maxWidth={0.85}
      >
        {teamName}
      </Text>

      {/* BUILDATHON label */}
      <Text
        position={[0, 0.16, -0.14]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.04}
        color={isSelected ? '#ffffff' : '#C00020'}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.15}
      >
        BUILDATHON 2026
      </Text>
    </group>
  );
});

export default TableCard;
