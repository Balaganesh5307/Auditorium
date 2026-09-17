import { useMemo, memo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import ManagementTable from '../scene/ManagementTable';

const COL_SPACING = 5.5;
const ROW_SPACING = 4.8;
const PADDING = 6;

const DEFAULT_ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const DEFAULT_COLS = [1, 2, 3, 4, 5];

// ── Shared materials — static instances ──
const MAT_FLOOR = new THREE.MeshStandardMaterial({ color: '#fdfdfd', roughness: 0.9, metalness: 0.05 });
const MAT_STAGE = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.35, metalness: 0.08 });
const MAT_STAIR = new THREE.MeshStandardMaterial({ color: '#f8f8f8', roughness: 0.4, metalness: 0.05 });
const MAT_STRINGER = new THREE.MeshStandardMaterial({ color: '#e2e2e2', roughness: 0.5 });
const MAT_ROOM_FLOOR = new THREE.MeshStandardMaterial({ color: '#f4f5f8', roughness: 0.85, metalness: 0.02 });
const MAT_ROOM_WALL = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.25, emissive: '#ffffff', emissiveIntensity: 0.25 });
const MAT_RED_ACCENT = new THREE.MeshStandardMaterial({ color: '#C00020', emissive: '#C00020', emissiveIntensity: 0.3 });
const MAT_RED_SIDE = new THREE.MeshStandardMaterial({ color: '#C00020', emissive: '#C00020', emissiveIntensity: 0.15 });
const MAT_WALL_BACK = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.25, emissive: '#ffffff', emissiveIntensity: 0.25 });
const MAT_WALL_SIDE = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.25, emissive: '#ffffff', emissiveIntensity: 0.25 });

// ── Window Materials ──
const MAT_GLASS = new THREE.MeshStandardMaterial({
  color: '#bfe0fa',
  transparent: true,
  opacity: 0.55,
  roughness: 0.1,
  metalness: 0.15,
});
const MAT_FRAME = new THREE.MeshStandardMaterial({
  color: '#1e1e20',
  roughness: 0.35,
  metalness: 0.3,
});
const MAT_SILL = new THREE.MeshStandardMaterial({
  color: '#ffffff',
  roughness: 0.3,
  emissive: '#ffffff',
  emissiveIntensity: 0.2,
});

// ── Classical Wood & Brass Door Materials ──
const MAT_WOOD_DOOR = new THREE.MeshStandardMaterial({
  color: '#853713',
  roughness: 0.38,
  metalness: 0.04,
});
const MAT_WOOD_PANEL = new THREE.MeshStandardMaterial({
  color: '#6a2a0d',
  roughness: 0.44,
  metalness: 0.02,
});
const MAT_WOOD_TRIM = new THREE.MeshStandardMaterial({
  color: '#9e461b',
  roughness: 0.34,
  metalness: 0.06,
});
const MAT_WOOD_FRAME = new THREE.MeshStandardMaterial({
  color: '#552109',
  roughness: 0.4,
  metalness: 0.04,
});
const MAT_BRASS_HANDLE = new THREE.MeshStandardMaterial({
  color: '#dfb253',
  roughness: 0.22,
  metalness: 0.88,
});



interface AuditoriumProps {
  rows?: string[];
  cols?: number[];
}

// ── Reusable Staircase Component with 4 stepped tiers & red edge accents ──
interface StageStairsProps {
  startX: number;
  stageFrontZ: number;
  width?: number;
  length?: number;
  height?: number;
}

const StageStairs = memo(function StageStairs({
  startX,
  stageFrontZ,
  width = 2.6,
  length = 3.0,
  height = 0.6,
}: StageStairsProps) {
  const stepsCount = 4;
  const stepDepth = length / stepsCount;
  const stepHeight = height / stepsCount;

  return (
    <group>
      {/* 4 Tiered Steps */}
      {Array.from({ length: stepsCount }).map((_, i) => {
        const currentHeight = (i + 1) * stepHeight;
        const zPos = stageFrontZ + (stepsCount - 1 - i) * stepDepth + stepDepth / 2;
        const nosingZ = stageFrontZ + (stepsCount - i) * stepDepth - 0.025;

        return (
          <group key={i}>
            {/* Step solid block */}
            <mesh position={[startX, currentHeight / 2, zPos]} castShadow receiveShadow>
              <boxGeometry args={[width, currentHeight, stepDepth]} />
              <primitive object={MAT_STAIR} attach="material" />
            </mesh>

            {/* Red accent strip on step nosing edge */}
            <mesh position={[startX, currentHeight + 0.005, nosingZ]}>
              <boxGeometry args={[width, 0.012, 0.06]} />
              <primitive object={MAT_RED_ACCENT} attach="material" />
            </mesh>
          </group>
        );
      })}

      {/* Left Stringer / side border */}
      <mesh position={[startX - width / 2 - 0.05, height / 2 + 0.05, stageFrontZ + length / 2]} castShadow>
        <boxGeometry args={[0.1, height + 0.15, length]} />
        <primitive object={MAT_STRINGER} attach="material" />
      </mesh>
      {/* Left Stringer red top rail */}
      <mesh position={[startX - width / 2 - 0.05, height + 0.14, stageFrontZ + length / 2]}>
        <boxGeometry args={[0.12, 0.025, length]} />
        <primitive object={MAT_RED_ACCENT} attach="material" />
      </mesh>

      {/* Right Stringer / side border */}
      <mesh position={[startX + width / 2 + 0.05, height / 2 + 0.05, stageFrontZ + length / 2]} castShadow>
        <boxGeometry args={[0.1, height + 0.15, length]} />
        <primitive object={MAT_STRINGER} attach="material" />
      </mesh>
      {/* Right Stringer red top rail */}
      <mesh position={[startX + width / 2 + 0.05, height + 0.14, stageFrontZ + length / 2]}>
        <boxGeometry args={[0.12, 0.025, length]} />
        <primitive object={MAT_RED_ACCENT} attach="material" />
      </mesh>
    </group>
  );
});

// ── Classical Carved Wooden Double Doors (Matches Provided Image) ──
interface ClassicalWoodenDoubleDoorProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
}

const ClassicalWoodenDoubleDoor = memo(function ClassicalWoodenDoubleDoor({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: ClassicalWoodenDoubleDoorProps) {
  const leaves = [-1.26, 1.26];

  return (
    <group position={position} rotation={rotation}>
      {/* ── Heavy Classical Wood Door Frame / Architrave ── */}
      {/* Left Frame Jamb */}
      <mesh position={[-2.56, 3.25, 0]} receiveShadow>
        <boxGeometry args={[0.12, 6.5, 0.2]} />
        <primitive object={MAT_WOOD_FRAME} attach="material" />
      </mesh>
      {/* Right Frame Jamb */}
      <mesh position={[2.56, 3.25, 0]} receiveShadow>
        <boxGeometry args={[0.12, 6.5, 0.2]} />
        <primitive object={MAT_WOOD_FRAME} attach="material" />
      </mesh>

      {/* Top Classical Entablature / Frieze & Crown Moulding */}
      <mesh position={[0, 6.12, 0]} receiveShadow>
        <boxGeometry args={[5.34, 0.24, 0.24]} />
        <primitive object={MAT_WOOD_FRAME} attach="material" />
      </mesh>
      <mesh position={[0, 6.32, 0.02]} receiveShadow>
        <boxGeometry args={[5.45, 0.16, 0.28]} />
        <primitive object={MAT_WOOD_TRIM} attach="material" />
      </mesh>
      <mesh position={[0, 6.44, 0.04]} receiveShadow>
        <boxGeometry args={[5.55, 0.08, 0.32]} />
        <primitive object={MAT_WOOD_TRIM} attach="material" />
      </mesh>

      {/* Vertical Meeting Astragal Bead between leaves */}
      <mesh position={[0, 2.95, 0.07]}>
        <boxGeometry args={[0.03, 5.9, 0.03]} />
        <primitive object={MAT_WOOD_TRIM} attach="material" />
      </mesh>

      {/* ── Symmetrical Double Door Leaves ── */}
      {leaves.map((leafX) => {
        const isRight = leafX > 0;
        const handleX = leafX + (isRight ? -0.93 : 0.93);

        return (
          <group key={leafX}>
            {/* Main Door Leaf Core Slab (+10% wider: 2.40) */}
            <mesh position={[leafX, 2.95, 0]} receiveShadow>
              <boxGeometry args={[2.4, 5.9, 0.12]} />
              <primitive object={MAT_WOOD_DOOR} attach="material" />
            </mesh>

            {/* Stiles & Rails (Raised perimeter framework) */}
            {/* Outer stile */}
            <mesh position={[leafX + (isRight ? 1.05 : -1.05), 2.95, 0.03]} receiveShadow>
              <boxGeometry args={[0.3, 5.9, 0.04]} />
              <primitive object={MAT_WOOD_TRIM} attach="material" />
            </mesh>
            {/* Inner meeting stile */}
            <mesh position={[leafX + (isRight ? -1.05 : 1.05), 2.95, 0.03]} receiveShadow>
              <boxGeometry args={[0.3, 5.9, 0.04]} />
              <primitive object={MAT_WOOD_TRIM} attach="material" />
            </mesh>
            {/* Top rail */}
            <mesh position={[leafX, 5.72, 0.03]} receiveShadow>
              <boxGeometry args={[1.8, 0.32, 0.04]} />
              <primitive object={MAT_WOOD_TRIM} attach="material" />
            </mesh>
            {/* Mid rail */}
            <mesh position={[leafX, 2.5, 0.03]} receiveShadow>
              <boxGeometry args={[1.8, 0.34, 0.04]} />
              <primitive object={MAT_WOOD_TRIM} attach="material" />
            </mesh>
            {/* Bottom kick rail */}
            <mesh position={[leafX, 0.35, 0.03]} receiveShadow>
              <boxGeometry args={[1.8, 0.65, 0.04]} />
              <primitive object={MAT_WOOD_TRIM} attach="material" />
            </mesh>

            {/* ── Upper Section: Tall Arched Classical Panel ── */}
            {/* Recessed backing field */}
            <mesh position={[leafX, 4.15, 0.01]}>
              <boxGeometry args={[1.62, 2.6, 0.03]} />
              <primitive object={MAT_WOOD_PANEL} attach="material" />
            </mesh>
            {/* Raised outer bevel frame */}
            <mesh position={[leafX, 4.15, 0.035]}>
              <boxGeometry args={[1.52, 2.45, 0.02]} />
              <primitive object={MAT_WOOD_TRIM} attach="material" />
            </mesh>
            {/* Inner recessed panel */}
            <mesh position={[leafX, 4.15, 0.02]}>
              <boxGeometry args={[1.36, 2.25, 0.02]} />
              <primitive object={MAT_WOOD_PANEL} attach="material" />
            </mesh>

            {/* Scrolled Crown / Arched Pediment at top of panel */}
            <mesh position={[leafX, 5.25, 0.055]}>
              <boxGeometry args={[1.48, 0.24, 0.05]} />
              <primitive object={MAT_WOOD_TRIM} attach="material" />
            </mesh>
            {/* Left Bracket / Corbel */}
            <mesh position={[leafX - 0.64, 5.15, 0.065]}>
              <boxGeometry args={[0.12, 0.22, 0.06]} />
              <primitive object={MAT_WOOD_TRIM} attach="material" />
            </mesh>
            {/* Right Bracket / Corbel */}
            <mesh position={[leafX + 0.64, 5.15, 0.065]}>
              <boxGeometry args={[0.12, 0.22, 0.06]} />
              <primitive object={MAT_WOOD_TRIM} attach="material" />
            </mesh>

            {/* Classical Carved Medallion / Crest */}
            <mesh position={[leafX, 4.6, 0.055]}>
              <boxGeometry args={[0.48, 0.44, 0.04]} />
              <primitive object={MAT_WOOD_TRIM} attach="material" />
            </mesh>
            <mesh position={[leafX, 4.6, 0.075]}>
              <boxGeometry args={[0.32, 0.32, 0.03]} />
              <primitive object={MAT_WOOD_DOOR} attach="material" />
            </mesh>
            {/* Dropping carved floral garland */}
            <mesh position={[leafX, 4.18, 0.045]}>
              <boxGeometry args={[0.26, 0.34, 0.03]} />
              <primitive object={MAT_WOOD_TRIM} attach="material" />
            </mesh>

            {/* ── Lower Section: Classical Rosette Panel ── */}
            {/* Recessed backing field */}
            <mesh position={[leafX, 1.5, 0.01]}>
              <boxGeometry args={[1.62, 1.5, 0.03]} />
              <primitive object={MAT_WOOD_PANEL} attach="material" />
            </mesh>
            {/* Raised outer bevel frame */}
            <mesh position={[leafX, 1.5, 0.035]}>
              <boxGeometry args={[1.52, 1.35, 0.02]} />
              <primitive object={MAT_WOOD_TRIM} attach="material" />
            </mesh>

            {/* Circular Carved Rosette Medallion */}
            <mesh position={[leafX, 1.95, 0.055]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.28, 0.28, 0.04, 24]} />
              <primitive object={MAT_WOOD_TRIM} attach="material" />
            </mesh>
            <mesh position={[leafX, 1.95, 0.075]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.14, 0.14, 0.03, 20]} />
              <primitive object={MAT_WOOD_DOOR} attach="material" />
            </mesh>

            {/* Scrolled Apron below Rosette */}
            <mesh position={[leafX, 1.25, 0.045]}>
              <boxGeometry args={[0.98, 0.07, 0.03]} />
              <primitive object={MAT_WOOD_TRIM} attach="material" />
            </mesh>
            {/* Corner carved accents */}
            <mesh position={[leafX - 0.57, 0.95, 0.045]}>
              <boxGeometry args={[0.11, 0.11, 0.03]} />
              <primitive object={MAT_WOOD_TRIM} attach="material" />
            </mesh>
            {/* Corner carved accents */}
            <mesh position={[leafX + 0.57, 0.95, 0.045]}>
              <boxGeometry args={[0.11, 0.11, 0.03]} />
              <primitive object={MAT_WOOD_TRIM} attach="material" />
            </mesh>

            {/* ── Ornate Antique Brass Hardware ── */}
            {/* Classical Brass Escutcheon Backplate */}
            <mesh position={[handleX, 2.5, 0.075]}>
              <boxGeometry args={[0.075, 0.5, 0.02]} />
              <primitive object={MAT_BRASS_HANDLE} attach="material" />
            </mesh>
            {/* Top Plate Finial */}
            <mesh position={[handleX, 2.77, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.038, 0.038, 0.016, 16]} />
              <primitive object={MAT_BRASS_HANDLE} attach="material" />
            </mesh>
            {/* Bottom Plate Finial */}
            <mesh position={[handleX, 2.23, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.038, 0.038, 0.016, 16]} />
              <primitive object={MAT_BRASS_HANDLE} attach="material" />
            </mesh>

            {/* Curved Brass Lever Handle */}
            <mesh position={[handleX, 2.5, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.03, 16]} />
              <primitive object={MAT_BRASS_HANDLE} attach="material" />
            </mesh>
            <mesh position={[handleX + (isRight ? 0.12 : -0.12), 2.5, 0.115]}>
              <boxGeometry args={[0.16, 0.035, 0.02]} />
              <primitive object={MAT_BRASS_HANDLE} attach="material" />
            </mesh>

            {/* Upper Brass Keyhole Escutcheon */}
            <mesh position={[handleX, 3.2, 0.065]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.042, 0.042, 0.016, 16]} />
              <primitive object={MAT_BRASS_HANDLE} attach="material" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
});

// ── Architectural Side Wall with Twin Feature Windows & Optional Doors ──
interface SideWallWithWindowsProps {
  xPos: number;
  backZ: number;
  halfD: number;
  isLeft: boolean;
  hasDoor1?: boolean;
  hasDoor2?: boolean;
}

const SideWallWithWindows = memo(function SideWallWithWindows({
  xPos,
  backZ,
  halfD,
  isLeft,
  hasDoor1 = !isLeft,
  hasDoor2 = true,
}: SideWallWithWindowsProps) {
  // Upper Window: Rows C to E (z = -11.5)
  // Lower Window: Rows H to K (z = 19.65)
  const upperWindowZ = -11.5;
  const lowerWindowZ = 19.65;
  const windowWidth = 7.0;
  const windowZList = [upperWindowZ, lowerWindowZ];

  const windowHeight = 6.0;
  const sillHeight = 0.9;
  const wallThickness = 0.35;

  const upperWindowStart = upperWindowZ - windowWidth / 2;
  const upperWindowEnd = upperWindowZ + windowWidth / 2;
  const lowerWindowStart = lowerWindowZ - windowWidth / 2;
  const lowerWindowEnd = lowerWindowZ + windowWidth / 2;

  // Solid front section (from lower window end to front wall)
  const frontSolidLength = Math.max(1, (halfD - 0.5) - lowerWindowEnd);
  const frontSolidZ = (lowerWindowEnd + halfD - 0.5) / 2;

  // Door 1: Front / Stage exit door — placed near Room 2 and above Row A (matching Image 2)
  const door1Z = -24.0;
  const doorSpan = 3.21;
  const colOffset = 2.93;

  // Door 2: Middle Walkway exit door (Rows F & G Aisle)
  const door2Z = 2.0; // Centered at cross-walkway aisle

  return (
    <group>
      {/* ── Solid Rear Section (with Door 1 at Row A / Room 2) ── */}
      {hasDoor1 ? (
        <group>
          {/* Wall from back wall to Door 1 */}
          <mesh position={[xPos, 5, (backZ + (door1Z - doorSpan)) / 2]} receiveShadow>
            <boxGeometry args={[wallThickness, 10, Math.max(0.1, (door1Z - doorSpan) - backZ)]} />
            <primitive object={MAT_WALL_SIDE} attach="material" />
          </mesh>
          {/* Side doorway columns framing Door 1 */}
          <mesh position={[xPos, 5, door1Z - colOffset]} receiveShadow>
            <boxGeometry args={[0.5, 10, 0.6]} />
            <primitive object={MAT_WALL_SIDE} attach="material" />
          </mesh>
          <mesh position={[xPos, 5, door1Z + colOffset]} receiveShadow>
            <boxGeometry args={[0.5, 10, 0.6]} />
            <primitive object={MAT_WALL_SIDE} attach="material" />
          </mesh>
          <mesh position={[xPos, 8.5, door1Z]} receiveShadow>
            <boxGeometry args={[wallThickness, 3.0, doorSpan * 2]} />
            <primitive object={MAT_WALL_SIDE} attach="material" />
          </mesh>
          {/* Door 1 Unit (Classical Carved Wooden Double Doors) */}
          <ClassicalWoodenDoubleDoor
            position={[xPos, 0, door1Z]}
            rotation={[0, isLeft ? Math.PI / 2 : -Math.PI / 2, 0]}
          />
          {/* Wall between Door 1 and Upper Window */}
          <mesh position={[xPos, 5, ((door1Z + doorSpan) + upperWindowStart) / 2]} receiveShadow>
            <boxGeometry args={[wallThickness, 10, Math.max(0.1, upperWindowStart - (door1Z + doorSpan))]} />
            <primitive object={MAT_WALL_SIDE} attach="material" />
          </mesh>
        </group>
      ) : (
        <mesh position={[xPos, 5, (backZ + upperWindowStart) / 2]} receiveShadow>
          <boxGeometry args={[wallThickness, 10, Math.max(1, upperWindowStart - backZ)]} />
          <primitive object={MAT_WALL_SIDE} attach="material" />
        </mesh>
      )}

      {/* ── Solid Middle Pier (with Door 2 at Rows F-G Walkway) ── */}
      {hasDoor2 ? (
        <group>
          {/* Pier between Upper Window and Door 2 (flanking Row F) */}
          <mesh position={[xPos, 5, (upperWindowEnd + (door2Z - doorSpan)) / 2]} receiveShadow>
            <boxGeometry args={[wallThickness, 10, Math.max(0.1, (door2Z - doorSpan) - upperWindowEnd)]} />
            <primitive object={MAT_WALL_SIDE} attach="material" />
          </mesh>
          {/* Side doorway columns framing Door 2 */}
          <mesh position={[xPos, 5, door2Z - colOffset]} receiveShadow>
            <boxGeometry args={[0.5, 10, 0.6]} />
            <primitive object={MAT_WALL_SIDE} attach="material" />
          </mesh>
          <mesh position={[xPos, 5, door2Z + colOffset]} receiveShadow>
            <boxGeometry args={[0.5, 10, 0.6]} />
            <primitive object={MAT_WALL_SIDE} attach="material" />
          </mesh>
          <mesh position={[xPos, 8.5, door2Z]} receiveShadow>
            <boxGeometry args={[wallThickness, 3.0, doorSpan * 2]} />
            <primitive object={MAT_WALL_SIDE} attach="material" />
          </mesh>
          {/* Door 2 Unit (Classical Carved Wooden Double Doors) */}
          <ClassicalWoodenDoubleDoor
            position={[xPos, 0, door2Z]}
            rotation={[0, isLeft ? Math.PI / 2 : -Math.PI / 2, 0]}
          />
          {/* Pier between Door 2 and Lower Window (flanking Row G) */}
          <mesh position={[xPos, 5, ((door2Z + doorSpan) + lowerWindowStart) / 2]} receiveShadow>
            <boxGeometry args={[wallThickness, 10, Math.max(0.1, lowerWindowStart - (door2Z + doorSpan))]} />
            <primitive object={MAT_WALL_SIDE} attach="material" />
          </mesh>
        </group>
      ) : (
        <mesh position={[xPos, 5, (upperWindowEnd + lowerWindowStart) / 2]} receiveShadow>
          <boxGeometry args={[wallThickness, 10, Math.max(1, lowerWindowStart - upperWindowEnd)]} />
          <primitive object={MAT_WALL_SIDE} attach="material" />
        </mesh>
      )}

      {/* Solid front section (flanking row L and corner) */}
      <mesh position={[xPos, 5, frontSolidZ]} receiveShadow>
        <boxGeometry args={[wallThickness, 10, frontSolidLength]} />
        <primitive object={MAT_WALL_SIDE} attach="material" />
      </mesh>

      {/* ── Both Feature Windows ── */}
      {windowZList.map((wZ) => (
        <group key={wZ}>
          {/* Header beam above the window */}
          <mesh position={[xPos, 8.5, wZ]}>
            <boxGeometry args={[wallThickness, 3.0, windowWidth]} />
            <primitive object={MAT_WALL_SIDE} attach="material" />
          </mesh>

          {/* Window Sill Ledge */}
          <mesh position={[xPos, sillHeight / 2, wZ]}>
            <boxGeometry args={[0.5, sillHeight, windowWidth]} />
            <primitive object={MAT_SILL} attach="material" />
          </mesh>

          {/* Red accent LED trim on sill */}
          <mesh position={[xPos + (isLeft ? 0.2 : -0.2), sillHeight + 0.01, wZ]}>
            <boxGeometry args={[0.08, 0.02, windowWidth]} />
            <primitive object={MAT_RED_ACCENT} attach="material" />
          </mesh>

          {/* Translucent Glass Pane */}
          <mesh position={[xPos, sillHeight + windowHeight / 2, wZ]}>
            <boxGeometry args={[0.06, windowHeight - 0.2, windowWidth - 0.1]} />
            <primitive object={MAT_GLASS} attach="material" />
          </mesh>

          {/* Window Frame: Bottom & Top Rails */}
          <mesh position={[xPos, sillHeight + 0.05, wZ]}>
            <boxGeometry args={[0.22, 0.1, windowWidth]} />
            <primitive object={MAT_FRAME} attach="material" />
          </mesh>
          <mesh position={[xPos, sillHeight + windowHeight - 0.05, wZ]}>
            <boxGeometry args={[0.22, 0.1, windowWidth]} />
            <primitive object={MAT_FRAME} attach="material" />
          </mesh>

          {/* Window Frame: Left & Right Vertical Jambs */}
          <mesh position={[xPos, sillHeight + windowHeight / 2, wZ - windowWidth / 2 + 0.05]}>
            <boxGeometry args={[0.22, windowHeight, 0.1]} />
            <primitive object={MAT_FRAME} attach="material" />
          </mesh>
          <mesh position={[xPos, sillHeight + windowHeight / 2, wZ + windowWidth / 2 - 0.05]}>
            <boxGeometry args={[0.22, windowHeight, 0.1]} />
            <primitive object={MAT_FRAME} attach="material" />
          </mesh>

          {/* Center Vertical Mullion */}
          <mesh position={[xPos, sillHeight + windowHeight / 2, wZ]}>
            <boxGeometry args={[0.24, windowHeight, 0.08]} />
            <primitive object={MAT_FRAME} attach="material" />
          </mesh>

          {/* Horizontal Transom Crossbar */}
          <mesh position={[xPos, sillHeight + windowHeight * 0.65, wZ]}>
            <boxGeometry args={[0.24, 0.08, windowWidth - 0.1]} />
            <primitive object={MAT_FRAME} attach="material" />
          </mesh>
        </group>
      ))}
    </group>
  );
});

// ── Bottom Wall with Windows and Grand Entrance Foyer Doors ──
interface BottomWallWithWindowsProps {
  halfW: number;
  bottomZ: number;
}

const BottomWallWithWindows = memo(function BottomWallWithWindows({
  halfW,
  bottomZ,
}: BottomWallWithWindowsProps) {
  const windowWidth = 7.0;
  const windowHeight = 6.0;
  const sillHeight = 0.9;
  const wallThickness = 0.4;
  const doorSpan = 3.21;

  const availableWingWidth = Math.max(10, halfW - doorSpan);
  const effectiveWindowWidth = Math.min(windowWidth, Math.max(5.0, availableWingWidth - 3.0));
  const sidePierWidth = (availableWingWidth - effectiveWindowWidth) / 2;

  const leftWindowX = -(doorSpan + sidePierWidth + effectiveWindowWidth / 2);
  const rightWindowX = doorSpan + sidePierWidth + effectiveWindowWidth / 2;

  const leftCornerX = -halfW + sidePierWidth / 2;
  const rightCornerX = halfW - sidePierWidth / 2;

  const leftInnerPierX = -(doorSpan + sidePierWidth / 2);
  const rightInnerPierX = doorSpan + sidePierWidth / 2;

  return (
    <group>
      {/* Left solid corner wall */}
      <mesh position={[leftCornerX, 5, bottomZ]} receiveShadow>
        <boxGeometry args={[sidePierWidth, 10, wallThickness]} />
        <primitive object={MAT_WALL_BACK} attach="material" />
      </mesh>

      {/* Right solid corner wall */}
      <mesh position={[rightCornerX, 5, bottomZ]} receiveShadow>
        <boxGeometry args={[sidePierWidth, 10, wallThickness]} />
        <primitive object={MAT_WALL_BACK} attach="material" />
      </mesh>

      {/* Wall piers between entrance doors and windows */}
      <mesh position={[leftInnerPierX, 5, bottomZ]} receiveShadow>
        <boxGeometry args={[sidePierWidth, 10, wallThickness]} />
        <primitive object={MAT_WALL_BACK} attach="material" />
      </mesh>
      <mesh position={[rightInnerPierX, 5, bottomZ]} receiveShadow>
        <boxGeometry args={[sidePierWidth, 10, wallThickness]} />
        <primitive object={MAT_WALL_BACK} attach="material" />
      </mesh>

      {/* Entrance doorway side columns */}
      <mesh position={[-2.93, 5, bottomZ]} receiveShadow>
        <boxGeometry args={[0.5, 10, 0.5]} />
        <primitive object={MAT_WALL_BACK} attach="material" />
      </mesh>
      <mesh position={[2.93, 5, bottomZ]} receiveShadow>
        <boxGeometry args={[0.5, 10, 0.5]} />
        <primitive object={MAT_WALL_BACK} attach="material" />
      </mesh>

      {/* Continuous header beam above bottom windows and doors */}
      <mesh position={[0, 8.5, bottomZ]}>
        <boxGeometry args={[halfW * 2 + 0.8, 3.0, wallThickness]} />
        <primitive object={MAT_WALL_BACK} attach="material" />
      </mesh>

      {/* ── 2 Panoramic Windows along the Bottom Wall (1 on Left, 1 on Right) ── */}
      {[leftWindowX, rightWindowX].map((x) => (
        <group key={x}>
          {/* Sill */}
          <mesh position={[x, sillHeight / 2, bottomZ]}>
            <boxGeometry args={[effectiveWindowWidth, sillHeight, 0.5]} />
            <primitive object={MAT_SILL} attach="material" />
          </mesh>

          {/* Red accent LED strip on sill */}
          <mesh position={[x, sillHeight + 0.01, bottomZ - 0.2]}>
            <boxGeometry args={[effectiveWindowWidth, 0.02, 0.08]} />
            <primitive object={MAT_RED_ACCENT} attach="material" />
          </mesh>

          {/* Translucent Glass Pane */}
          <mesh position={[x, sillHeight + windowHeight / 2, bottomZ]}>
            <boxGeometry args={[effectiveWindowWidth - 0.1, windowHeight - 0.2, 0.06]} />
            <primitive object={MAT_GLASS} attach="material" />
          </mesh>

          {/* Window Frame: Bottom & Top Rails */}
          <mesh position={[x, sillHeight + 0.05, bottomZ]}>
            <boxGeometry args={[effectiveWindowWidth, 0.1, 0.22]} />
            <primitive object={MAT_FRAME} attach="material" />
          </mesh>
          <mesh position={[x, sillHeight + windowHeight - 0.05, bottomZ]}>
            <boxGeometry args={[effectiveWindowWidth, 0.1, 0.22]} />
            <primitive object={MAT_FRAME} attach="material" />
          </mesh>

          {/* Window Frame: Left & Right Vertical Jambs */}
          <mesh position={[x - effectiveWindowWidth / 2 + 0.05, sillHeight + windowHeight / 2, bottomZ]}>
            <boxGeometry args={[0.1, windowHeight, 0.22]} />
            <primitive object={MAT_FRAME} attach="material" />
          </mesh>
          <mesh position={[x + effectiveWindowWidth / 2 - 0.05, sillHeight + windowHeight / 2, bottomZ]}>
            <boxGeometry args={[0.1, windowHeight, 0.22]} />
            <primitive object={MAT_FRAME} attach="material" />
          </mesh>

          {/* Center Vertical Mullion */}
          <mesh position={[x, sillHeight + windowHeight / 2, bottomZ]}>
            <boxGeometry args={[0.08, windowHeight, 0.24]} />
            <primitive object={MAT_FRAME} attach="material" />
          </mesh>

          {/* Horizontal Transom Crossbar */}
          <mesh position={[x, sillHeight + windowHeight * 0.65, bottomZ]}>
            <boxGeometry args={[effectiveWindowWidth - 0.1, 0.08, 0.24]} />
            <primitive object={MAT_FRAME} attach="material" />
          </mesh>
        </group>
      ))}

      {/* ── Central Main Entrance Classical Carved Wooden Double Doors ── */}
      <ClassicalWoodenDoubleDoor position={[0, 0, bottomZ]} rotation={[0, Math.PI, 0]} />
    </group>
  );
});

const Auditorium = memo(function Auditorium({ rows = DEFAULT_ROWS, cols = DEFAULT_COLS }: AuditoriumProps) {
  const safeRows = rows || DEFAULT_ROWS;
  const safeCols = cols || DEFAULT_COLS;

  // Dynamic sizing based on grid
  const floorWidth = useMemo(() => Math.max(20, safeCols.length * COL_SPACING + PADDING * 2 + 10), [safeCols]);
  const floorDepth = useMemo(() => Math.max(30, safeRows.length * ROW_SPACING + PADDING * 2 + 15), [safeRows]);
  const halfW = floorWidth / 2;
  const halfD = floorDepth / 2;

  const backZ = -halfD - 0.5; // Exact rear boundary of floor and side walls
  const bottomZ = halfD - 0.5; // Exact front/bottom boundary

  // Extended stage depth (top-down height) and elevation
  const stageDepth = 8.0;
  const stageHeight = 0.6;
  const stageZ = backZ + 0.2 + stageDepth / 2; // Flush against back wall
  // Extended stage width to span across the seating columns
  const stageWidth = Math.min(floorWidth - 14, Math.max(28, safeCols.length * COL_SPACING + 3.5));

  // Stage Z boundaries
  const stageBackZ = backZ + 0.2; // Flush against back wall
  const stageFrontZ = stageZ + stageDepth / 2; // Original front boundary
  const stageExtensionDepth = 1.2;
  const newStageFrontZ = stageFrontZ + stageExtensionDepth; // Front edge of the stage (red line)

  // Stairs configuration — completely recessed INSIDE the stage
  const stairWidth = 2.6;
  const stairLength = 3.0;
  const stairTotalWidth = stairWidth + 0.2; // 2.8 (including stringers)
  const leftStairX = -stageWidth / 2 + stairTotalWidth / 2;
  const rightStairX = stageWidth / 2 - stairTotalWidth / 2;

  // Recessed stair positioning: stairs descend towards newStageFrontZ, so bottom step is flush with stage front
  const stairStart = newStageFrontZ - stairLength; // Top of stairs landing inside stage
  const rearStageDepth = stairStart - stageBackZ;
  const rearStageCenterZ = stageBackZ + rearStageDepth / 2;
  const extendedStageWidth = stageWidth - 2 * stairTotalWidth;
  const centerStageCenterZ = stairStart + stairLength / 2;
  const totalStageDepth = newStageFrontZ - stageBackZ;
  const stageOverallCenterZ = (stageBackZ + newStageFrontZ) / 2;

  // Room 1 (Left) and Room 2 (Right) geometry parameters — flush against back wall with aisle clearance for side doors
  const roomWidth = Math.max(5.0, halfW - stageWidth / 2 - 1.5);
  const roomDepth = stageDepth;
  const roomCenterZ = stageZ;
  const room1CenterX = -(stageWidth / 2 + 0.3 + roomWidth / 2);
  const room2CenterX = stageWidth / 2 + 0.3 + roomWidth / 2;

  // Dynamic geometries
  const floorGeo = useMemo(() => new THREE.PlaneGeometry(floorWidth, floorDepth), [floorWidth, floorDepth]);
  // Rear stage platform (behind the recessed stairs)
  const stageGeo = useMemo(
    () => new THREE.BoxGeometry(stageWidth, stageHeight, rearStageDepth),
    [stageWidth, stageHeight, rearStageDepth]
  );
  // Center stage platform (between the recessed stairs)
  const stageExtensionGeo = useMemo(
    () => new THREE.BoxGeometry(extendedStageWidth, stageHeight, stairLength),
    [extendedStageWidth, stageHeight, stairLength]
  );
  const stageExtensionAccentGeo = useMemo(
    () => new THREE.BoxGeometry(extendedStageWidth, 0.04, 0.08),
    [extendedStageWidth]
  );
  const stairLandingAccentGeo = useMemo(
    () => new THREE.BoxGeometry(stairTotalWidth, 0.04, 0.08),
    [stairTotalWidth]
  );
  const stageSideGeo = useMemo(
    () => new THREE.BoxGeometry(0.06, stageHeight + 0.02, totalStageDepth),
    [stageHeight, totalStageDepth]
  );
  const backWallGeo = useMemo(() => new THREE.BoxGeometry(floorWidth + 0.8, 10, 0.4), [floorWidth]);

  // Room dividing & front walls
  const roomFloorGeo = useMemo(() => new THREE.BoxGeometry(roomWidth, 0.04, roomDepth), [roomWidth, roomDepth]);
  const roomFloorBorderGeo = useMemo(() => new THREE.BoxGeometry(roomWidth + 0.1, 0.02, roomDepth + 0.1), [roomWidth, roomDepth]);
  const roomDividerGeo = useMemo(() => new THREE.BoxGeometry(0.25, 3.2, roomDepth), [roomDepth]);
  const roomFrontWallPartGeo = useMemo(() => new THREE.BoxGeometry(Math.max(1, roomWidth - 2.4), 3.2, 0.25), [roomWidth]);
  const roomCeilingGeo = useMemo(() => new THREE.BoxGeometry(roomWidth, 0.25, roomDepth), [roomWidth, roomDepth]);

  const gridSize = Math.max(floorWidth, floorDepth);

  // Management Table Area (placed along left wall spanning rows A & B)
  const rowAZ = (0 - (safeRows.length - 1) / 2) * ROW_SPACING - (safeRows.length > 1 ? 6.5 / 2 : 0);
  const rowBZ = (1 - (safeRows.length - 1) / 2) * ROW_SPACING - (safeRows.length > 1 ? 6.5 / 2 : 0);
  const mgmtCenterZ = (rowAZ + rowBZ) / 2;
  const mgmtDepth = Math.abs(rowBZ - rowAZ) + 4.2;
  const mgmtWidth = 5.2;
  const mgmtCenterX = -halfW + 0.35 + mgmtWidth / 2;

  return (
    <group>
      {/* ── Floor ── */}
      <mesh geometry={floorGeo} material={MAT_FLOOR} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -0.5]} receiveShadow />
      <gridHelper args={[gridSize, Math.round(gridSize), '#e5e5e5', '#f0f0f0']} position={[0, 0.001, -0.5]} />

      {/* ── Rear Stage Platform ── */}
      <mesh geometry={stageGeo} material={MAT_STAGE} position={[0, stageHeight / 2, rearStageCenterZ]} castShadow receiveShadow />

      {/* ── Center Stage Platform (flanked by the recessed stairs) ── */}
      <mesh geometry={stageExtensionGeo} material={MAT_STAGE} position={[0, stageHeight / 2, centerStageCenterZ]} castShadow receiveShadow />

      {/* Stage red accent line along the new front edge (red line in user screenshot) */}
      <mesh geometry={stageExtensionAccentGeo} material={MAT_RED_ACCENT} position={[0, stageHeight + 0.01, newStageFrontZ]} />

      {/* Red accent lines framing the top landing of each recessed stairwell */}
      <mesh geometry={stairLandingAccentGeo} material={MAT_RED_ACCENT} position={[leftStairX, stageHeight + 0.01, stairStart]} />
      <mesh geometry={stairLandingAccentGeo} material={MAT_RED_ACCENT} position={[rightStairX, stageHeight + 0.01, stairStart]} />

      {/* Stage side accents */}
      <mesh geometry={stageSideGeo} material={MAT_RED_SIDE} position={[-stageWidth / 2, stageHeight / 2, stageOverallCenterZ]} />
      <mesh geometry={stageSideGeo} material={MAT_RED_SIDE} position={[stageWidth / 2, stageHeight / 2, stageOverallCenterZ]} />

      {/* ── "STAGE" Label on Stage Floor (Centered on the extended stage) ── */}
      <Text
        position={[0, stageHeight + 0.02, stageZ + 0.8]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={2.0}
        color="#111111"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.3}
      >
        STAGE
      </Text>

      {/* Stage backdrop text */}
      <Text
        position={[0, 3.4, backZ + 0.25]}
        fontSize={1.3}
        color="#0a0a0a"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.12}
      >
        BUILDATHON
      </Text>
      <Text
        position={[0, 2.1, backZ + 0.25]}
        fontSize={0.55}
        color="#C00020"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.4}
      >
        2026
      </Text>

      {/* ── Steps / Stairs recessed completely INSIDE the stage ── */}
      <StageStairs
        startX={leftStairX}
        stageFrontZ={stairStart}
        width={stairWidth}
        length={stairLength}
        height={stageHeight}
      />
      <StageStairs
        startX={rightStairX}
        stageFrontZ={stairStart}
        width={stairWidth}
        length={stairLength}
        height={stageHeight}
      />

      {/* ── Left Box: ROOM 1 ── */}
      <group>
        {/* Room 1 floor base with subtle contrast */}
        <mesh geometry={roomFloorGeo} material={MAT_ROOM_FLOOR} position={[room1CenterX, 0.02, roomCenterZ]} receiveShadow />
        {/* Room 1 red perimeter edge line */}
        <mesh geometry={roomFloorBorderGeo} material={MAT_RED_SIDE} position={[room1CenterX, 0.01, roomCenterZ]} />

        {/* Dividing wall between Room 1 and Stage/Stairs */}
        <mesh geometry={roomDividerGeo} material={MAT_ROOM_WALL} position={[-stageWidth / 2 - 0.15, 1.6, roomCenterZ]} receiveShadow />

        {/* Room 1 Front Wall Partition (with doorway gap) */}
        <mesh geometry={roomFrontWallPartGeo} material={MAT_ROOM_WALL} position={[room1CenterX - 1.2, 1.6, roomCenterZ + roomDepth / 2]} receiveShadow />

        {/* Room 1 Ceiling / Canopy */}
        <mesh geometry={roomCeilingGeo} material={MAT_WALL_BACK} position={[room1CenterX, 3.5, roomCenterZ]} />

        {/* ── "ROOM 1" Top-Down Floor Label ── */}
        <Text
          position={[room1CenterX, 0.06, roomCenterZ]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={1.25}
          color="#C00020"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.18}
        >
          ROOM 1
        </Text>

        {/* Front wall entrance text */}
        <Text
          position={[room1CenterX, 2.7, roomCenterZ + roomDepth / 2 + 0.15]}
          fontSize={0.7}
          color="#111111"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.15}
        >
          ROOM 1
        </Text>
      </group>

      {/* ── Right Box: ROOM 2 ── */}
      <group>
        {/* Room 2 floor base with subtle contrast */}
        <mesh geometry={roomFloorGeo} material={MAT_ROOM_FLOOR} position={[room2CenterX, 0.02, roomCenterZ]} receiveShadow />
        {/* Room 2 red perimeter edge line */}
        <mesh geometry={roomFloorBorderGeo} material={MAT_RED_SIDE} position={[room2CenterX, 0.01, roomCenterZ]} />

        {/* Dividing wall between Room 2 and Stage/Stairs */}
        <mesh geometry={roomDividerGeo} material={MAT_ROOM_WALL} position={[stageWidth / 2 + 0.15, 1.6, roomCenterZ]} receiveShadow />

        {/* Room 2 Front Wall Partition (with doorway gap) */}
        <mesh geometry={roomFrontWallPartGeo} material={MAT_ROOM_WALL} position={[room2CenterX + 1.2, 1.6, roomCenterZ + roomDepth / 2]} receiveShadow />

        {/* Room 2 Ceiling / Canopy */}
        <mesh geometry={roomCeilingGeo} material={MAT_WALL_BACK} position={[room2CenterX, 3.5, roomCenterZ]} />

        {/* ── "ROOM 2" Top-Down Floor Label ── */}
        <Text
          position={[room2CenterX, 0.06, roomCenterZ]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={1.25}
          color="#C00020"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.18}
        >
          ROOM 2
        </Text>

        {/* Front wall entrance text */}
        <Text
          position={[room2CenterX, 2.7, roomCenterZ + roomDepth / 2 + 0.15]}
          fontSize={0.7}
          color="#111111"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.15}
        >
          ROOM 2
        </Text>
      </group>

      {/* ── Left Aisle: Management Table (Rows A & B) ── */}
      <ManagementTable
        x={mgmtCenterX}
        z={mgmtCenterZ}
        width={mgmtWidth}
        depth={mgmtDepth}
      />

      {/* ── Perimeter Walls with Windows ── */}
      {/* Back wall flush at rear boundary */}
      <mesh geometry={backWallGeo} material={MAT_WALL_BACK} position={[0, 5, backZ]} />

      {/* Left Wall with Windows & Walkway Exit Door (Rows F-G Aisle) */}
      <SideWallWithWindows
        xPos={-halfW}
        backZ={backZ}
        halfD={halfD}
        isLeft={true}
        hasDoor1={false}
        hasDoor2={true}
      />

      {/* Right Wall with Windows & Side Exit Doors (Row A & Rows F-G Aisle) */}
      <SideWallWithWindows
        xPos={halfW}
        backZ={backZ}
        halfD={halfD}
        isLeft={false}
        hasDoor1={true}
        hasDoor2={true}
      />

      {/* Bottom Wall with 6 Panoramic Windows & Main Entrance Foyer */}
      <BottomWallWithWindows
        halfW={halfW}
        bottomZ={bottomZ}
      />
    </group>
  );
});

export default Auditorium;
