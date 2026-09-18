import { useRef, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { MapControls } from '@react-three/drei';

export type CameraState = 'INTRO' | 'AUDITORIUM' | 'TABLE';

// Camera presets
const CAMERA_PRESETS = {
  INTRO: {
    position: new THREE.Vector3(0, 2, 24),
    lookAt: new THREE.Vector3(0, 2, 0),
    fov: 60,
  },
  AUDITORIUM: {
    position: new THREE.Vector3(0, 35, 0.001), // Tiny offset prevents gimbal lock
    lookAt: new THREE.Vector3(0, 0, 0),
    fov: 50,
  },
};

const DEFAULT_ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const DEFAULT_COLS = [1, 2, 3, 4, 5, 6];

interface CameraControllerProps {
  cameraState: CameraState;
  selectedTablePosition: [number, number, number] | null;
  onTransitionComplete?: () => void;
  rows?: string[];
  cols?: number[];
}

export default function CameraController({
  cameraState,
  selectedTablePosition,
  onTransitionComplete,
  rows = DEFAULT_ROWS,
  cols = DEFAULT_COLS,
}: CameraControllerProps) {
  const { camera, size } = useThree();
  // PERF: Use a ref instead of useState for isAnimating.
  // The old useState triggered a React re-render of the entire Canvas tree
  // every time an animation started/stopped, which cascaded through all 3D components.
  const isAnimatingRef = useRef(false);
  const controlsRef = useRef<any>(null);

  const safeRows = rows || DEFAULT_ROWS;
  const safeCols = cols || DEFAULT_COLS;

  // Dynamic limits based on grid
  const COL_SPACING = 5.5;
  const ROW_SPACING = 4.8;
  const panLimitX = Math.max(18, (safeCols.length * COL_SPACING) / 2 + 8.5);
  const panLimitZ = Math.max(22, (safeRows.length * ROW_SPACING) / 2 + 6);

  const aspect = size.width / Math.max(1, size.height);
  const isMobile = aspect < 1.0;
  const vFovRad = (50 / 2) * (Math.PI / 180);
  const contentWidth = Math.max(34, safeCols.length * COL_SPACING + 16);
  const heightForWidth = contentWidth / (2 * Math.tan(vFovRad) * aspect);
  const cameraHeight = isMobile
    ? Math.max(heightForWidth * 0.8, 40)
    : Math.max(35, Math.max(safeRows.length * ROW_SPACING, safeCols.length * COL_SPACING) * 0.9);
  const targetZ = isMobile ? -3.5 : 0;

  // Store limits in refs to avoid stale closures in useFrame
  const limitsRef = useRef({ panLimitX, panLimitZ });
  limitsRef.current = { panLimitX, panLimitZ };

  const stateRef = useRef({ cameraState });
  stateRef.current = { cameraState };

  // Restrict panning strictly within the walls — only runs meaningful work in AUDITORIUM
  useFrame(() => {
    const { cameraState: cs } = stateRef.current;
    if (cs !== 'AUDITORIUM' || isAnimatingRef.current || !controlsRef.current) return;

    const target = controlsRef.current.target;
    const { panLimitX: lx, panLimitZ: lz } = limitsRef.current;
    const clampedX = THREE.MathUtils.clamp(target.x, -lx, lx);
    const clampedZ = THREE.MathUtils.clamp(target.z, -lz, lz);

    if (target.x !== clampedX || target.z !== clampedZ) {
      const diffX = clampedX - target.x;
      const diffZ = clampedZ - target.z;
      target.x = clampedX;
      target.z = clampedZ;
      camera.position.x += diffX;
      camera.position.z += diffZ;
    }
  });

  const animateCamera = useCallback(
    (
      targetPos: THREE.Vector3,
      targetLookAt: THREE.Vector3,
      targetFov: number,
      duration: number,
      ease: string,
      onComplete?: () => void
    ) => {
      // Kill any running animations
      gsap.killTweensOf(camera.position);
      if (controlsRef.current) gsap.killTweensOf(controlsRef.current.target);
      gsap.killTweensOf(camera);

      isAnimatingRef.current = true;

      const tl = gsap.timeline({
        onComplete: () => {
          isAnimatingRef.current = false;
          onComplete?.();
        },
      });

      tl.to(
        camera.position,
        {
          x: targetPos.x,
          y: targetPos.y,
          z: targetPos.z,
          duration,
          ease,
        },
        0
      );

      if (controlsRef.current) {
        tl.to(
          controlsRef.current.target,
          {
            x: targetLookAt.x,
            y: targetLookAt.y,
            z: targetLookAt.z,
            duration,
            ease,
            onUpdate: () => controlsRef.current?.update(),
          },
          0
        );
      } else {
        // Fallback if controls aren't mounted yet
        camera.lookAt(targetLookAt);
      }

      const perspCam = camera as THREE.PerspectiveCamera;
      if (Math.abs(perspCam.fov - targetFov) > 0.5) {
        tl.to(
          perspCam,
          {
            fov: targetFov,
            duration: duration * 0.8,
            ease,
            onUpdate: () => {
              perspCam.updateProjectionMatrix();
            },
          },
          0
        );
      }
    },
    [camera]
  );

  // Set initial camera position immediately (no animation)
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      const s = CAMERA_PRESETS.INTRO;
      camera.position.set(s.position.x, s.position.y, s.position.z);
      if (controlsRef.current) {
        controlsRef.current.target.copy(s.lookAt);
        controlsRef.current.update();
      } else {
        camera.lookAt(s.lookAt);
      }
      const perspCam = camera as THREE.PerspectiveCamera;
      perspCam.fov = s.fov;
      perspCam.updateProjectionMatrix();
    }
  }, [camera]);

  // React to camera state changes
  useEffect(() => {
    // Skip the very first render (initial position already set above)
    if (!initialized.current) return;

    switch (cameraState) {
      case 'INTRO': {
        const s = CAMERA_PRESETS.INTRO;
        animateCamera(s.position, s.lookAt, s.fov, 1.2, 'power3.inOut', onTransitionComplete);
        break;
      }
      case 'AUDITORIUM': {
        const s = CAMERA_PRESETS.AUDITORIUM;
        const dynamicPos = new THREE.Vector3(0, cameraHeight, 0.001);
        const dynamicLookAt = new THREE.Vector3(0, 0, targetZ);
        animateCamera(dynamicPos, dynamicLookAt, s.fov, 2.0, 'power2.inOut', onTransitionComplete);
        break;
      }
      case 'TABLE': {
        if (selectedTablePosition) {
          const [tx, , tz] = selectedTablePosition;
          // 3D perspective view: slightly top-down, zoomed in tight
          const targetPos = new THREE.Vector3(tx + 1.0, 4.5, tz + 2.0);
          const targetLookAt = new THREE.Vector3(tx, 0.5, tz);
          animateCamera(targetPos, targetLookAt, 40, 1.4, 'power3.inOut', onTransitionComplete);
        }
        break;
      }
    }
  }, [cameraState, selectedTablePosition, cameraHeight, targetZ, animateCamera, onTransitionComplete]);

  // Allow map panning when in AUDITORIUM state
  const controlsEnabled = cameraState === 'AUDITORIUM';

  return (
    <MapControls
      ref={controlsRef}
      enabled={true}
      enablePan={controlsEnabled}
      enableZoom={controlsEnabled}
      enableRotate={false}
      enableDamping
      dampingFactor={0.05}
      minDistance={5}
      maxDistance={120}
      maxPolarAngle={Math.PI} // Remove limits so GSAP can animate freely
      minPolarAngle={0}
      touches={{
        ONE: THREE.TOUCH.PAN,
        TWO: THREE.TOUCH.DOLLY_PAN,
      }}
    />
  );
}
