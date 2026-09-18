import { useRef, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { MapControls } from '@react-three/drei';

export type CameraState = 'INTRO' | 'AUDITORIUM' | 'TABLE';

// Camera presets
// Camera presets
const CAMERA_PRESETS = {
  INTRO: {
    position: new THREE.Vector3(0, 2, 24),
    lookAt: new THREE.Vector3(0, 2, 0),
    fov: 60,
  },
  AUDITORIUM: {
    // Top-down bird's-eye map view with safe 2.5° offset to prevent gimbal lock
    position: new THREE.Vector3(0, 68, 1),
    lookAt: new THREE.Vector3(0, 0, -2),
    fov: 50,
  },
};

const DEFAULT_ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const DEFAULT_COLS = [1, 2, 3, 4, 5];

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
  const isAnimatingRef = useRef(false);
  const controlsRef = useRef<any>(null);

  const safeRows = rows || DEFAULT_ROWS;
  const safeCols = cols || DEFAULT_COLS;

  // Dynamic layout metrics matching Auditorium.tsx
  const COL_SPACING = 5.5;
  const ROW_SPACING = 4.8;
  const floorWidth = Math.max(20, safeCols.length * COL_SPACING + 22);
  const floorDepth = Math.max(30, safeRows.length * ROW_SPACING + 27);
  const halfW = floorWidth / 2;
  const halfD = floorDepth / 2;

  // Pan boundaries: comfortably encompasses stage, management area, and all seating rows
  const minX = -halfW + 6;
  const maxX = halfW - 6;
  const minZ = -halfD + 4;
  const maxZ = halfD - 4;

  // Responsive framing based on viewport aspect ratio (mobile vs desktop)
  const aspect = size.width / Math.max(1, size.height);
  const isMobile = aspect < 1.0 || size.width < 768;

  // Calculate required height so all columns and row labels fit neatly horizontally in portrait mobile
  const vFovRad = (50 / 2) * (Math.PI / 180);
  const contentWidth = Math.max(34, safeCols.length * COL_SPACING + 16);
  const heightForWidth = contentWidth / (2 * Math.tan(vFovRad) * aspect);
  const contentDepth = Math.max(48, safeRows.length * ROW_SPACING + 22);
  const heightForDepth = contentDepth / (2 * Math.tan(vFovRad));

  // In mobile view, height scales with aspect so the entire width is framed just like the user's image
  const cameraHeight = isMobile
    ? Math.max(heightForWidth, heightForDepth * 0.96)
    : Math.max(54, Math.max(safeRows.length * ROW_SPACING * 1.05, safeCols.length * COL_SPACING * 1.1));

  // Target centered with stage right at the top
  const targetLookAtZ = isMobile ? -3.5 : -2.0;
  // 90° top-down angle looking straight down onto the floor plane (0.05 safe offset avoids gimbal lock)
  const cameraZ = targetLookAtZ + 0.05;

  // Store limits in refs to avoid stale closures in useFrame
  const limitsRef = useRef({ minX, maxX, minZ, maxZ });
  limitsRef.current = { minX, maxX, minZ, maxZ };

  const stateRef = useRef({ cameraState });
  stateRef.current = { cameraState };

  // Helper to directly activate/deactivate Three.js MapControls
  const setControlsActive = useCallback((active: boolean) => {
    if (controlsRef.current) {
      controlsRef.current.enabled = active;
      controlsRef.current.enablePan = active;
      controlsRef.current.enableZoom = active;
      if (active) {
        controlsRef.current.update();
      }
    }
  }, []);

  // Restrict panning strictly within the walls without fighting inertia
  useFrame(() => {
    const { cameraState: cs } = stateRef.current;
    if (cs !== 'AUDITORIUM' || isAnimatingRef.current || !controlsRef.current) return;

    const target = controlsRef.current.target;
    const { minX: x1, maxX: x2, minZ: z1, maxZ: z2 } = limitsRef.current;
    const clampedX = THREE.MathUtils.clamp(target.x, x1, x2);
    const clampedZ = THREE.MathUtils.clamp(target.z, z1, z2);

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
      // Safely deactivate user controls during flight so drags don't fight GSAP
      setControlsActive(false);

      // Kill any running animations
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(camera);

      isAnimatingRef.current = true;

      // Track the intermediate lookAt point smoothly without invoking controls.update()
      const currentLookAt = controlsRef.current
        ? controlsRef.current.target.clone()
        : new THREE.Vector3(0, 2, 0);

      const tl = gsap.timeline({
        onComplete: () => {
          isAnimatingRef.current = false;
          // Synchronize controls once at the final destination
          if (controlsRef.current) {
            controlsRef.current.target.set(targetLookAt.x, targetLookAt.y, targetLookAt.z);
            camera.position.set(targetPos.x, targetPos.y, targetPos.z);
            controlsRef.current.update();
          }
          // Re-enable controls if we finished in AUDITORIUM mode
          if (stateRef.current.cameraState === 'AUDITORIUM') {
            setControlsActive(true);
          }
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

      tl.to(
        currentLookAt,
        {
          x: targetLookAt.x,
          y: targetLookAt.y,
          z: targetLookAt.z,
          duration,
          ease,
          onUpdate: () => {
            camera.lookAt(currentLookAt);
          },
        },
        0
      );

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
    [camera, setControlsActive]
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
        setControlsActive(false);
      } else {
        camera.lookAt(s.lookAt);
      }
      const perspCam = camera as THREE.PerspectiveCamera;
      perspCam.fov = s.fov;
      perspCam.updateProjectionMatrix();
    }
  }, [camera, setControlsActive]);

  // Track previous state to prevent unnecessary re-animations on window resize / state update
  const prevStateRef = useRef<CameraState | null>(null);
  const prevTablePosRef = useRef<string | null>(null);

  // React to camera state changes
  useEffect(() => {
    if (!initialized.current) return;

    const posKey = selectedTablePosition ? selectedTablePosition.join(',') : null;
    const stateChanged = prevStateRef.current !== cameraState;
    const tablePosChanged = cameraState === 'TABLE' && prevTablePosRef.current !== posKey;

    if (!stateChanged && !tablePosChanged) return;

    prevStateRef.current = cameraState;
    prevTablePosRef.current = posKey;

    switch (cameraState) {
      case 'INTRO': {
        const s = CAMERA_PRESETS.INTRO;
        animateCamera(s.position, s.lookAt, s.fov, 1.2, 'power3.inOut', onTransitionComplete);
        break;
      }
      case 'AUDITORIUM': {
        const targetLookAt = new THREE.Vector3(0, 0, targetLookAtZ);
        const dynamicPos = new THREE.Vector3(0, cameraHeight, cameraZ);
        animateCamera(dynamicPos, targetLookAt, 50, 1.8, 'power2.inOut', onTransitionComplete);
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
  }, [cameraState, selectedTablePosition, cameraHeight, targetLookAtZ, cameraZ, animateCamera, onTransitionComplete]);

  return (
    <MapControls
      ref={controlsRef}
      enabled={cameraState === 'AUDITORIUM'}
      enablePan={true}
      enableZoom={true}
      enableRotate={false}
      screenSpacePanning={true}
      enableDamping
      dampingFactor={0.09}
      panSpeed={1.4}
      minDistance={8}
      maxDistance={180}
      minPolarAngle={0}
      maxPolarAngle={Math.PI}
      touches={{
        ONE: THREE.TOUCH.PAN,
        TWO: THREE.TOUCH.DOLLY_PAN,
      }}
    />
  );
}
