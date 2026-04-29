import assert from 'node:assert/strict';
import test from 'node:test';
import type { View } from './lib/controls';
import { getPanoLocationForView, getViewBounds, normalizePan } from './viewBounds';

const ASPECT_RATIO = 3 / 1;

const isInside = (point: { x: number; y: number }, boxes: ReturnType<typeof getViewBounds>['boxes']) => {
  return boxes.some(box => point.x >= box.x1 && point.x <= box.x2 && point.y >= box.y1 && point.y <= box.y2);
};

test('converts a camera view back to the pano location it is looking at', () => {
  const pickedLocation = { x: Math.PI / 2, y: 0.1 };
  const viewLookingAtLocation: View = {
    pan: normalizePan(pickedLocation.x - Math.PI),
    tilt: pickedLocation.y,
    fov: 40
  };

  const center = getPanoLocationForView(viewLookingAtLocation);

  assert.equal(center.pan, pickedLocation.x);
  assert.equal(center.tilt, pickedLocation.y);
});

test('builds bounds that include a saved location when the view is aimed at it', () => {
  const pickedLocation = { x: Math.PI / 2, y: 0.1 };
  const viewLookingAtLocation: View = {
    pan: normalizePan(pickedLocation.x - Math.PI),
    tilt: pickedLocation.y,
    fov: 40
  };

  const boxes = getViewBounds(viewLookingAtLocation, ASPECT_RATIO).boxes;

  assert.equal(isInside(pickedLocation, boxes), true);
});

test('splits wrapped bounds so points near the panorama seam stay searchable', () => {
  const pickedLocation = { x: -2.737230706070006, y: -0.41460485624690196 };
  const viewLookingAtLocation: View = {
    pan: normalizePan(pickedLocation.x - Math.PI),
    tilt: pickedLocation.y,
    fov: 40
  };

  const boxes = getViewBounds(viewLookingAtLocation, ASPECT_RATIO).boxes;

  assert.equal(boxes.length, 2);
  assert.equal(isInside(pickedLocation, boxes), true);
});

test('includes the middle of the bottom edge for wide pano views', () => {
  const view: View = {
    pan: normalizePan(-2.737230706070006 - Math.PI),
    tilt: 0,
    fov: 40
  };
  const bottomEdgePoint = {
    x: -2.737230706070006,
    y: -(view.fov / 2) * (Math.PI / 180)
  };

  const boxes = getViewBounds(view, ASPECT_RATIO).boxes;

  assert.equal(isInside(bottomEdgePoint, boxes), true);
});
