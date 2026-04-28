import assert from 'node:assert/strict';
import test from 'node:test';
import type { View } from '../../components/pano/lib/controls';
import { normalizePan } from '../../components/pano/viewBounds';
import { getConfirmedObservationFilter, type IdentificationFilters } from './filters';

const ASPECT_RATIO = 3 / 1;

const createFilters = (overrides: Partial<IdentificationFilters> = {}): IdentificationFilters => ({
  view: { pan: 0, tilt: 0, fov: 40 },
  dirty: true,
  active: true,
  dateRange: undefined,
  type: 'all',
  ...overrides
});

const boxesFor = (within: NonNullable<ReturnType<typeof getConfirmedObservationFilter>['within']>) =>
  Array.isArray(within) ? within : [within];

test('does not send a location box until the view filter is active', () => {
  const filter = getConfirmedObservationFilter(createFilters({ dirty: false, active: false }), ASPECT_RATIO);

  assert.equal(filter.within, undefined);
});

test('sends a within box that matches a picked observation location', () => {
  const pickedLocation = { x: Math.PI / 2, y: 0.1 };
  const viewLookingAtLocation: View = {
    pan: normalizePan(pickedLocation.x - Math.PI),
    tilt: pickedLocation.y,
    fov: 40
  };

  const filter = getConfirmedObservationFilter(createFilters({ view: viewLookingAtLocation }), ASPECT_RATIO);

  assert.ok(filter.within);
  assert.ok(
    boxesFor(filter.within).some(
      box =>
        pickedLocation.x >= box.x1 &&
        pickedLocation.x <= box.x2 &&
        pickedLocation.y >= box.y1 &&
        pickedLocation.y <= box.y2
    )
  );
});

test('sends split within boxes for picked observation locations across the panorama seam', () => {
  const pickedLocation = { x: -2.737230706070006, y: -0.41460485624690196 };
  const viewLookingAtLocation: View = {
    pan: normalizePan(pickedLocation.x - Math.PI),
    tilt: pickedLocation.y,
    fov: 40
  };

  const filter = getConfirmedObservationFilter(createFilters({ view: viewLookingAtLocation }), ASPECT_RATIO);

  assert.ok(Array.isArray(filter.within));
  assert.equal(filter.within.length, 2);
  assert.ok(
    filter.within.some(
      box =>
        pickedLocation.x >= box.x1 &&
        pickedLocation.x <= box.x2 &&
        pickedLocation.y >= box.y1 &&
        pickedLocation.y <= box.y2
    )
  );
});
