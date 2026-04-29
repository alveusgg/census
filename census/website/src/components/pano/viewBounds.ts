import type { View } from './lib/controls';

type Vector3 = { x: number; y: number; z: number };
export type ViewBoundsBox = { x1: number; y1: number; x2: number; y2: number };

const TWO_PI = Math.PI * 2;

export const normalizePan = (value: number) => {
  return ((((value + Math.PI) % TWO_PI) + TWO_PI) % TWO_PI) - Math.PI;
};

export const getPanoLocationForView = (view: View) => ({
  pan: normalizePan(view.pan + Math.PI),
  tilt: view.tilt
});

export const getViewBounds = (view: View, aspectRatio: number) => {
  const center = getPanoLocationForView(view);
  const halfV = Math.tan(((view.fov / 2) * Math.PI) / 180);
  const halfH = halfV * aspectRatio;
  const cosP = Math.cos(center.pan);
  const sinP = Math.sin(center.pan);
  const cosT = Math.cos(center.tilt);
  const sinT = Math.sin(center.tilt);

  const forward = { x: cosT * sinP, y: sinT, z: cosT * cosP };
  const right = { x: cosP, y: 0, z: -sinP };
  const up = { x: -sinT * sinP, y: cosT, z: -sinT * cosP };
  const corners = [
    getViewPoint(forward, right, up, -halfH, halfV),
    getViewPoint(forward, right, up, halfH, halfV),
    getViewPoint(forward, right, up, halfH, -halfV),
    getViewPoint(forward, right, up, -halfH, -halfV)
  ];
  const boundaryPoints = [
    ...corners,
    getViewPoint(forward, right, up, 0, halfV),
    getViewPoint(forward, right, up, halfH, 0),
    getViewPoint(forward, right, up, 0, -halfV),
    getViewPoint(forward, right, up, -halfH, 0)
  ];
  const panBounds = getUnwrappedPanBounds(
    boundaryPoints.map(point => point.pan),
    center.pan
  );
  const tiltBounds = {
    min: round(Math.min(...boundaryPoints.map(point => point.tilt))),
    max: round(Math.max(...boundaryPoints.map(point => point.tilt)))
  };

  return {
    view: {
      pan: round(view.pan),
      tilt: round(view.tilt),
      fov: round(view.fov),
      aspectRatio: round(aspectRatio)
    },
    center: {
      pan: round(center.pan),
      tilt: round(center.tilt)
    },
    corners,
    bounds: {
      pan: panBounds,
      tilt: tiltBounds
    },
    boxes: getBoundsBoxes(panBounds, tiltBounds)
  };
};

const getViewPoint = (
  forward: Vector3,
  right: Vector3,
  up: Vector3,
  horizontalOffset: number,
  verticalOffset: number
) => getPanTilt(add(add(forward, scale(right, horizontalOffset)), scale(up, verticalOffset)));

const getUnwrappedPanBounds = (pans: number[], centerPan: number) => {
  const unwrapped = pans.map(pan => normalizePan(pan - centerPan) + centerPan);
  return {
    min: round(Math.min(...unwrapped)),
    max: round(Math.max(...unwrapped))
  };
};

const getBoundsBoxes = (pan: { min: number; max: number }, tilt: { min: number; max: number }): ViewBoundsBox[] => {
  if (pan.min < -Math.PI) {
    return [
      { x1: round(normalizePan(pan.min)), y1: tilt.min, x2: round(Math.PI), y2: tilt.max },
      { x1: round(-Math.PI), y1: tilt.min, x2: pan.max, y2: tilt.max }
    ];
  }

  if (pan.max > Math.PI) {
    return [
      { x1: pan.min, y1: tilt.min, x2: round(Math.PI), y2: tilt.max },
      { x1: round(-Math.PI), y1: tilt.min, x2: round(normalizePan(pan.max)), y2: tilt.max }
    ];
  }

  return [{ x1: pan.min, y1: tilt.min, x2: pan.max, y2: tilt.max }];
};

const add = (a: Vector3, b: Vector3): Vector3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });

const scale = (vector: Vector3, amount: number): Vector3 => ({
  x: vector.x * amount,
  y: vector.y * amount,
  z: vector.z * amount
});

const getPanTilt = (vector: Vector3) => {
  const length = Math.hypot(vector.x, vector.y, vector.z);
  const normalized = { x: vector.x / length, y: vector.y / length, z: vector.z / length };
  return {
    pan: round(normalizePan(Math.atan2(normalized.x, normalized.z))),
    tilt: round(Math.asin(normalized.y))
  };
};

const round = (value: number) => Math.round(value * 10000) / 10000;
