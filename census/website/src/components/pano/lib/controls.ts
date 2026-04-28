import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export interface View {
  pan: number;
  tilt: number;
  fov: number;
}

export function isInView(point: { pan: number; tilt: number }, view: View, aspectRatio?: number): boolean {
  // Point direction vector (same convention as panTiltToPoint).
  const cosTP = Math.cos(point.tilt);
  const dp = {
    x: cosTP * Math.sin(point.pan),
    y: Math.sin(point.tilt),
    z: cosTP * Math.cos(point.pan)
  };

  // Camera-space basis derived from the view direction.
  //   Forward F = (cosT·sinP,  sinT, cosT·cosP)  — view centre direction
  //   Right   R = (cosP,       0,    −sinP)       — F × worldUp, normalised
  //   Up      U = (−sinT·sinP, cosT, −sinT·cosP) — R × F
  const cosP = Math.cos(view.pan);
  const sinP = Math.sin(view.pan);
  const cosT = Math.cos(view.tilt);
  const sinT = Math.sin(view.tilt);

  const dF = dp.x * cosT * sinP + dp.y * sinT + dp.z * cosT * cosP;
  const dR = dp.x * cosP - dp.z * sinP;
  const dU = -dp.x * sinT * sinP + dp.y * cosT - dp.z * sinT * cosP;

  if (dF <= 0) return false;

  const halfVFovRad = (view.fov / 2) * (Math.PI / 180);

  if (aspectRatio !== undefined) {
    const tanHalfV = Math.tan(halfVFovRad);
    return Math.abs(dU / dF) <= tanHalfV && Math.abs(dR / dF) <= tanHalfV * aspectRatio;
  }

  // Circular approximation: dF = cos(angle) since both direction vectors are unit length.
  return dF >= Math.cos(halfVFovRad);
}

export interface ControlOptions {
  fov?: {
    min: number;
    max: number;
    sensitivity?: number;
  };
  getSensitivityForCurrent?: (value: View) => number;
  bounds?: {
    tilt?: {
      min: number;
      max: number;
    };
  };
  invert?: {
    horizontal?: boolean;
    vertical?: boolean;
  };
  enabled?: boolean;
}

interface UseViewControlsOptions {
  value: View;
  onChange: (value: View) => void;
  options: ControlOptions;
  onInteractionEnd?: (wasDrag: boolean, value: View) => void;
}

const DRAG_THRESHOLD_PX = 4;
const DEFAULT_FOV_BOUNDS: NonNullable<ControlOptions['fov']> = { min: 4, max: 60 };

export function useViewControls({ value, onChange, options, onInteractionEnd }: UseViewControlsOptions) {
  const { camera, gl } = useThree();
  const fovOptions = options.fov ?? DEFAULT_FOV_BOUNDS;
  const getSensitivityForCurrent = options.getSensitivityForCurrent ?? (() => 0.001);
  const minTilt = options.bounds?.tilt?.min ?? -Math.PI / 2;
  const maxTilt = options.bounds?.tilt?.max ?? Math.PI / 2;
  const zoomSensitivity = fovOptions.sensitivity ?? 0.05;
  const invertHorizontal = options.invert?.horizontal ?? false;
  const invertVertical = options.invert?.vertical ?? false;
  const enabled = options.enabled ?? true;
  const interactionRef = useRef({
    value,
    isDragging: false,
    didDrag: false,
    dragStart: { x: 0, y: 0 },
    lastMouse: { x: 0, y: 0 }
  });

  useEffect(() => {
    if (!interactionRef.current.isDragging) {
      interactionRef.current.value = value;
    }
  }, [value]);

  useEffect(() => {
    if (!enabled) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      interactionRef.current.isDragging = true;
      interactionRef.current.didDrag = false;
      interactionRef.current.dragStart = { x: e.clientX, y: e.clientY };
      interactionRef.current.lastMouse = { x: e.clientX, y: e.clientY };
      gl.domElement.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: MouseEvent) => {
      const interaction = interactionRef.current;
      if (!interaction.isDragging) return;

      const deltaX = e.clientX - interaction.lastMouse.x;
      const deltaY = e.clientY - interaction.lastMouse.y;
      const dragDistanceX = e.clientX - interaction.dragStart.x;
      const dragDistanceY = e.clientY - interaction.dragStart.y;
      interaction.didDrag ||= Math.hypot(dragDistanceX, dragDistanceY) >= DRAG_THRESHOLD_PX;

      const nextValue = getNextDragValue({
        value: interaction.value,
        deltaX,
        deltaY,
        sensitivity: getSensitivityForCurrent(interaction.value),
        invertHorizontal,
        invertVertical,
        minTilt,
        maxTilt
      });

      interaction.value = nextValue;
      interaction.lastMouse = { x: e.clientX, y: e.clientY };
      applyCameraView(camera, nextValue);
      onChange(nextValue);
    };

    const handleMouseUp = () => {
      const interaction = interactionRef.current;
      if (!interaction.isDragging) return;

      onInteractionEnd?.(interaction.didDrag, interaction.value);
      interaction.isDragging = false;
      interaction.didDrag = false;
      gl.domElement.style.cursor = 'grab';
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const nextValue = {
        ...interactionRef.current.value,
        fov: THREE.MathUtils.clamp(
          interactionRef.current.value.fov + e.deltaY * zoomSensitivity,
          fovOptions.min,
          fovOptions.max
        )
      };
      interactionRef.current.value = nextValue;
      onChange(nextValue);
    };

    gl.domElement.style.cursor = 'grab';
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
    enabled,
    fovOptions.min,
    fovOptions.max,
    getSensitivityForCurrent,
    invertHorizontal,
    invertVertical,
    maxTilt,
    minTilt,
    onChange,
    onInteractionEnd,
    zoomSensitivity
  ]);

  useFrame(() => {
    applyCameraView(camera, value);
  });
}

function getNextDragValue({
  value,
  deltaX,
  deltaY,
  sensitivity,
  invertHorizontal,
  invertVertical,
  minTilt,
  maxTilt
}: {
  value: View;
  deltaX: number;
  deltaY: number;
  sensitivity: number;
  invertHorizontal: boolean;
  invertVertical: boolean;
  minTilt: number;
  maxTilt: number;
}): View {
  const horizontalDirection = invertHorizontal ? 1 : -1;
  const verticalDirection = invertVertical ? 1 : -1;
  const pan = value.pan + deltaX * sensitivity * horizontalDirection;
  const tilt = value.tilt + deltaY * sensitivity * verticalDirection;

  return {
    ...value,
    pan: THREE.MathUtils.euclideanModulo(pan + Math.PI, Math.PI * 2) - Math.PI,
    tilt: THREE.MathUtils.clamp(tilt, minTilt, maxTilt)
  };
}

function applyCameraView(camera: THREE.Camera, value: View) {
  if (!(camera instanceof THREE.PerspectiveCamera)) return;

  camera.rotation.order = 'YXZ';
  camera.rotation.y = value.pan;
  camera.rotation.x = value.tilt;
  camera.fov = value.fov;
  camera.updateProjectionMatrix();
}
