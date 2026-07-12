import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { defaultPanoMapManagerOptions, getVisibleTiles, type PanoTileLevel } from './PanoMapManager';

const LEVEL: PanoTileLevel = {
  id: 'test',
  width: 24000,
  height: 12000,
  tileWidth: 1000,
  tileHeight: 1000,
  columns: 24,
  rows: 12,
  showBelowFov: 20,
  tiles: Array.from({ length: 12 }, (_, row) => Array.from({ length: 24 }, (_, column) => `/${row}/${column}.webp`))
};

function createCamera({ fov, aspect, pan = 0 }: { fov: number; aspect: number; pan?: number }) {
  const camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
  camera.rotation.order = 'YXZ';
  camera.rotation.y = pan;
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();
  return camera;
}

function getColumns(camera: THREE.PerspectiveCamera) {
  return new Set(getVisibleTiles(camera, LEVEL, 0).map(tile => tile.column));
}

test('uses the camera aspect ratio when resolving visible tiles', () => {
  const squareColumns = getColumns(createCamera({ fov: 16, aspect: 1 }));
  const wideColumns = getColumns(createCamera({ fov: 16, aspect: 3 }));

  assert.ok(wideColumns.size > squareColumns.size);
});

test('does not include tiles on the opposite side of a narrow centered view', () => {
  const columns = getColumns(createCamera({ fov: 16, aspect: 1 }));

  assert.equal(columns.has(6), false);
  assert.equal(columns.has(7), false);
  assert.equal(columns.has(8), false);
});

test('wraps visible tile selection across the panorama seam', () => {
  const columns = getColumns(createCamera({ fov: 16, aspect: 2, pan: -Math.PI / 2 }));

  assert.equal(columns.has(0), true);
  assert.equal(columns.has(23), true);
});

test('does not preload tiles outside the viewport by default', () => {
  assert.equal(defaultPanoMapManagerOptions.preloadTileMargin, 0);
});
