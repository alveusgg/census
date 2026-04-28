import type { RootState } from '@react-three/fiber';
import * as THREE from 'three';
import type { View } from './lib/controls';
import type { Simulation } from './lib/simulation';

export const FOV_BOUNDS: { min: number; max: number; sensitivity?: number } = { min: 4, max: 60 };

const INTRO_DELAY_FRAMES = 0;
const INTRO_DURATION_FRAMES = 120;
const INTRO_FRAME_RATE = 60;
const INTRO_TILT_OFFSET = THREE.MathUtils.degToRad(24);
const INTRO_FOV_OFFSET = 2;
const INTRO_START_EXPOSURE = 20;
const INTRO_END_EXPOSURE = 1;

export function createIntroSimulation(): Simulation<View> {
  let hasStarted = false;

  return (frame: RootState, gl: THREE.WebGLRenderer, targetValue: View) => {
    if (!hasStarted) {
      hasStarted = true;
      gl.toneMapping = THREE.ACESFilmicToneMapping;
      gl.toneMappingExposure = INTRO_START_EXPOSURE;
    }

    const currentFrame = Math.floor(frame.clock.elapsedTime * INTRO_FRAME_RATE);
    const progress = THREE.MathUtils.clamp((currentFrame - INTRO_DELAY_FRAMES) / INTRO_DURATION_FRAMES, 0, 1);
    const easedProgress = 1 - (1 - progress) ** 3;
    const introStart = getIntroStartView(targetValue);

    gl.toneMappingExposure = THREE.MathUtils.lerp(INTRO_START_EXPOSURE, INTRO_END_EXPOSURE, easedProgress);

    return {
      value: {
        pan: THREE.MathUtils.lerp(introStart.pan, targetValue.pan, easedProgress),
        tilt: THREE.MathUtils.lerp(introStart.tilt, targetValue.tilt, easedProgress),
        fov: THREE.MathUtils.lerp(introStart.fov, targetValue.fov, easedProgress)
      },
      done: progress === 1,
      reset: () => {
        gl.toneMappingExposure = INTRO_END_EXPOSURE;
      }
    };
  };
}

export function getSensitivityForFov(fov: number) {
  const t = THREE.MathUtils.clamp((fov - FOV_BOUNDS.min) / (FOV_BOUNDS.max - FOV_BOUNDS.min), 0, 1);
  const eased = t ** 0.75;
  return THREE.MathUtils.lerp(0.0002, 0.0024, eased);
}

function getIntroStartView(value: View): View {
  return {
    tilt: THREE.MathUtils.clamp(value.tilt - INTRO_TILT_OFFSET, -Math.PI / 2, Math.PI / 2),
    pan: value.pan,
    fov: THREE.MathUtils.clamp(value.fov + INTRO_FOV_OFFSET, FOV_BOUNDS.min, FOV_BOUNDS.max)
  };
}
