import { useRef, useEffect, memo } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { Text } from '@react-three/drei';

// ── Shared materials — created once, reused ──
const MAT_SHUTTER = new THREE.MeshStandardMaterial({ color: '#0a0a0a', roughness: 0.3, metalness: 0.4 });
const MAT_RED_ACCENT = new THREE.MeshStandardMaterial({ color: '#C00020', emissive: '#C00020', emissiveIntensity: 0.5 });
const MAT_FRAME = new THREE.MeshStandardMaterial({ color: '#111111', metalness: 0.3 });

// ── Shared geometry — created once ──
const SHUTTER_GEO = new THREE.BoxGeometry(5, 9, 0.3);
const RED_LINE_GEO = new THREE.BoxGeometry(0.04, 9, 0.02);
const FRAME_TOP_GEO = new THREE.BoxGeometry(10.5, 0.3, 0.5);
const FRAME_SIDE_GEO = new THREE.BoxGeometry(0.3, 9.5, 0.5);

interface ShutterProps {
  isOpen: boolean;
}

const Shutter = memo(function Shutter({ isOpen }: ShutterProps) {
  const leftRef = useRef<THREE.Mesh>(null);
  const rightRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (isOpen) {
      // Animate shutters open
      if (leftRef.current) {
        gsap.to(leftRef.current.position, {
          x: -8,
          duration: 1.5,
          ease: 'power3.inOut',
        });
      }
      if (rightRef.current) {
        gsap.to(rightRef.current.position, {
          x: 8,
          duration: 1.5,
          ease: 'power3.inOut',
        });
      }
    } else {
      // Reset to closed
      if (leftRef.current) {
        leftRef.current.position.x = -2.5;
      }
      if (rightRef.current) {
        rightRef.current.position.x = 2.5;
      }
    }
  }, [isOpen]);

  return (
    <group position={[0, 4, 20]}>
      {/* Left shutter */}
      <mesh ref={leftRef} position={[-2.5, 0, 0]} geometry={SHUTTER_GEO} material={MAT_SHUTTER} />

      {/* Right shutter */}
      <mesh ref={rightRef} position={[2.5, 0, 0]} geometry={SHUTTER_GEO} material={MAT_SHUTTER} />

      {/* Red accent line on left shutter (right edge) */}
      <group position={[-2.5, 0, 0]}>
        <mesh position={[2.48, 0, 0.16]} geometry={RED_LINE_GEO} material={MAT_RED_ACCENT} />
      </group>

      {/* Red accent line on right shutter (left edge) */}
      <group position={[2.5, 0, 0]}>
        <mesh position={[-2.48, 0, 0.16]} geometry={RED_LINE_GEO} material={MAT_RED_ACCENT} />
      </group>

      {/* Branding on shutters */}
      <Text
        position={[-2.5, 1, 0.2]}
        fontSize={0.4}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.15}
      >
        BUILD
      </Text>
      <Text
        position={[2.5, 1, 0.2]}
        fontSize={0.4}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.15}
      >
        ATHON
      </Text>
      <Text
        position={[0, -0.5, 0.2]}
        fontSize={0.25}
        color="#C00020"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.4}
      >
        2026
      </Text>

      {/* Door frame */}
      <mesh position={[0, 8.6, 0]} geometry={FRAME_TOP_GEO} material={MAT_FRAME} />
      <mesh position={[-5.15, 4, 0]} geometry={FRAME_SIDE_GEO} material={MAT_FRAME} />
      <mesh position={[5.15, 4, 0]} geometry={FRAME_SIDE_GEO} material={MAT_FRAME} />
    </group>
  );
});

export default Shutter;
