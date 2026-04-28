import type { ControlOptions, View } from './lib/controls';
import { FOV_BOUNDS, getSensitivityForFov } from './simulation';

export type { ControlOptions, View } from './lib/controls';

export const DEFAULT_VIEW: View = { tilt: 0.1, pan: Math.PI / 2, fov: 40 };

export function createPanoControlOptions(): ControlOptions {
  return {
    fov: FOV_BOUNDS,
    getSensitivityForCurrent: value => getSensitivityForFov(value.fov),
    bounds: {
      tilt: { min: -Math.PI / 2, max: Math.PI / 2 }
    },
    invert: { horizontal: true, vertical: true }
  };
}
