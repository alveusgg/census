import { CameraControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface PTZCameraControlsProps {
  /** Initial pan rotation in radians (Y axis) */
  pan?: number;
  /** Initial tilt rotation in radians (X axis) */
  tilt?: number;
  /** Callback when camera rotation changes */
  onChange?: (pan: number, tilt: number) => void;
  /** Callback when the user starts interacting */
  onInteractionStart?: () => void;
  /** Callback when a pointer interaction ends; true means it was a drag */
  onInteractionEnd?: (wasDrag: boolean) => void;
  /** Current camera field-of-view in degrees */
  fov?: number;
  /** Callback when camera fov changes */
  onFovChange?: (fov: number) => void;
  /** Drag sensitivity: fixed number, or [at minFov, at maxFov] */
  sensitivity?: number | [number, number];
  /** Scroll wheel sensitivity for fov changes (default: 0.05) */
  zoomSensitivity?: number;
  /** Minimum fov in degrees (default: 15) */
  minFov?: number;
  /** Maximum fov in degrees (default: 90) */
  maxFov?: number;
  /** Minimum tilt angle in radians (default: -Math.PI/2) */
  minTilt?: number;
  /** Maximum tilt angle in radians (default: Math.PI/2) */
  maxTilt?: number;
  /** Whether controls are enabled (default: true) */
  enabled?: boolean;
  /** Invert horizontal mouse drag direction (default: false) */
  invertHorizontal?: boolean;
  /** Invert vertical mouse drag direction (default: false) */
  invertVertical?: boolean;
}

export const usePTZCameraControls = ({
  pan = 0,
  tilt = 0,
  onChange,
  onInteractionStart,
  onInteractionEnd,
  fov = 40,
  onFovChange,
  sensitivity = 0.001,
  zoomSensitivity = 0.05,
  minFov = 4,
  maxFov = 60,
  minTilt = -Math.PI / 2,
  maxTilt = Math.PI / 2,
  enabled = true,
  invertHorizontal = false,
  invertVertical = false
}: PTZCameraControlsProps) => {
  const DRAG_THRESHOLD_PX = 4;
  const controlsRef = useRef<CameraControls>(null);
  const { camera, gl } = useThree();

  // Track current rotation
  const rotationRef = useRef({ x: tilt, y: pan });
  const fovRef = useRef(fov);
  const isDraggingRef = useRef(false);
  const didDragRef = useRef(false);
  const dragStartMouseRef = useRef({ x: 0, y: 0 });
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // Initialize camera position and rotation
  useEffect(() => {
    if (!controlsRef.current) return;

    // Set camera to origin (fixed position for PTZ)
    camera.position.set(0, 0, 0);

    // Set initial rotation
    camera.rotation.order = 'YXZ';
    camera.rotation.y = pan;
    camera.rotation.x = tilt;

    // Disable all default CameraControls behaviors
    // We want manual control only
    const controls = controlsRef.current;
    controls.enabled = false;
    controls.minDistance = 0;
    controls.maxDistance = 0;

    // Update rotation ref
    rotationRef.current = { x: tilt, y: pan };
  }, [camera, pan, tilt]);

  // Handle mouse drag for PTZ rotation
  useEffect(() => {
    if (!enabled) return;

    const handleMouseDown = (e: MouseEvent) => {
      // Only handle left mouse button
      if (e.button !== 0) return;
      onInteractionStart?.();
      isDraggingRef.current = true;
      didDragRef.current = false;
      dragStartMouseRef.current = { x: e.clientX, y: e.clientY };
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      gl.domElement.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      // Calculate mouse delta
      const deltaX = e.clientX - lastMouseRef.current.x;
      const deltaY = e.clientY - lastMouseRef.current.y;
      const dragDistanceX = e.clientX - dragStartMouseRef.current.x;
      const dragDistanceY = e.clientY - dragStartMouseRef.current.y;
      if (!didDragRef.current) {
        didDragRef.current = Math.hypot(dragDistanceX, dragDistanceY) >= DRAG_THRESHOLD_PX;
      }
      const effectiveSensitivity = Array.isArray(sensitivity)
        ? (() => {
            const [minFovSensitivity, maxFovSensitivity] = sensitivity;
            const fovRange = maxFov - minFov;
            const t = fovRange === 0 ? 0 : THREE.MathUtils.clamp((fovRef.current - minFov) / fovRange, 0, 1);
            return THREE.MathUtils.lerp(minFovSensitivity, maxFovSensitivity, t);
          })()
        : sensitivity;

      // Update rotation based on mouse movement
      const horizontalDirection = invertHorizontal ? 1 : -1;
      rotationRef.current.y += deltaX * effectiveSensitivity * horizontalDirection;
      const verticalDirection = invertVertical ? 1 : -1;
      rotationRef.current.x += deltaY * effectiveSensitivity * verticalDirection;

      // Clamp vertical rotation to prevent flipping
      rotationRef.current.x = Math.max(minTilt, Math.min(maxTilt, rotationRef.current.x));

      // Normalize pan rotation to [-PI, PI]
      rotationRef.current.y = THREE.MathUtils.euclideanModulo(rotationRef.current.y + Math.PI, Math.PI * 2) - Math.PI;

      // Apply rotation to camera
      camera.rotation.order = 'YXZ';
      camera.rotation.y = rotationRef.current.y;
      camera.rotation.x = rotationRef.current.x;

      // Notify parent component
      onChange?.(rotationRef.current.y, rotationRef.current.x);

      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        onInteractionEnd?.(didDragRef.current);
        isDraggingRef.current = false;
        didDragRef.current = false;
        gl.domElement.style.cursor = 'grab';
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      onInteractionStart?.();
      const nextFov = THREE.MathUtils.clamp(fovRef.current + e.deltaY * zoomSensitivity, minFov, maxFov);
      fovRef.current = nextFov;
      onFovChange?.(nextFov);
    };

    // Set initial cursor
    gl.domElement.style.cursor = 'grab';

    // Add event listeners
    gl.domElement.addEventListener('mousedown', handleMouseDown);
    gl.domElement.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      gl.domElement.removeEventListener('mousedown', handleMouseDown);
      gl.domElement.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      gl.domElement.style.cursor = 'default';
    };
  }, [
    camera,
    gl,
    onChange,
    onFovChange,
    onInteractionStart,
    onInteractionEnd,
    sensitivity,
    zoomSensitivity,
    minFov,
    maxFov,
    minTilt,
    maxTilt,
    enabled,
    invertHorizontal,
    invertVertical
  ]);

  // Sync external rotation changes
  useEffect(() => {
    if (isDraggingRef.current) return; // Don't override during user interaction

    rotationRef.current = { x: tilt, y: pan };
    fovRef.current = fov;
    camera.rotation.order = 'YXZ';
    camera.rotation.y = pan;
    camera.rotation.x = tilt;
  }, [pan, tilt, fov, camera]);

  // We still render CameraControls for future extensibility,
  // but it's disabled since we handle mouse interactions manually
  return;
};
