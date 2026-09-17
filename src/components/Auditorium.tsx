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
  const sideWallGeo = useMemo(() => new THREE.BoxGeometry(0.4, 10, floorDepth + 0.8), [floorDepth]);
  const bottomWallGeo = useMemo(() => new THREE.BoxGeometry(floorWidth + 0.8, 10, 0.4), [floorWidth]);

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

      {/* ── Solid Perimeter Walls (No Windows / No Doors) ── */}
      {/* Back wall flush at rear boundary */}
      <mesh geometry={backWallGeo} material={MAT_WALL_BACK} position={[0, 5, backZ]} receiveShadow />

      {/* Front / Bottom Wall */}
      <mesh geometry={bottomWallGeo} material={MAT_WALL_BACK} position={[0, 5, bottomZ]} receiveShadow />

      {/* Left Wall */}
      <mesh geometry={sideWallGeo} material={MAT_WALL_SIDE} position={[-halfW, 5, (backZ + bottomZ) / 2]} receiveShadow />

      {/* Right Wall */}
      <mesh geometry={sideWallGeo} material={MAT_WALL_SIDE} position={[halfW, 5, (backZ + bottomZ) / 2]} receiveShadow />
    </group>
  );
});

export default Auditorium;
