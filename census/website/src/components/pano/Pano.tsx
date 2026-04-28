import { Canvas, type ThreeEvent } from '@react-three/fiber';

import { enablePatches } from 'immer';
enablePatches();

import { useSuspenseQuery } from '@tanstack/react-query';
import { PropsWithChildren, useMemo, useRef, type Dispatch, type FC, type SetStateAction } from 'react';
import * as THREE from 'three';
import { createPanoControlOptions, type ControlOptions, type View } from './controls';
import equirectangularImage from './garden-high.jpg';
import equirectangularImageLow from './garden-low.jpg';
import { useViewControls } from './lib/controls';
import { defaultPanoMapManagerOptions, PanoMapManager } from './lib/PanoMapManager';
import { useWithSimulation, type Simulation } from './lib/simulation';
import { createIntroSimulation } from './simulation';
// import wolf from './presets';

export { DEFAULT_VIEW, type View } from './controls';

type ViewState = [View, Dispatch<SetStateAction<View>>];

interface PanoViewProps {
  state: ViewState;

  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  onInteractionEnd?: (wasDrag: boolean, value: View) => void;
}

const manager = new PanoMapManager(
  {
    pano: {
      low: equirectangularImageLow,
      high: equirectangularImage
    }
  },
  defaultPanoMapManagerOptions
);

import { motion } from 'framer-motion';
const sphere: [number, number, number] = [10, 64, 64];
export const PANO_RADIUS = sphere[0];
export const PIP_RADIUS = PANO_RADIUS - 0.35;

const POST_DRAG_CLICK_SUPPRESS_MS = 250;

export const Pano: FC<PropsWithChildren<PanoViewProps>> = ({ state, onClick, onInteractionEnd, children }) => {
  const controlOptions = useMemo<ControlOptions>(() => createPanoControlOptions(), []);
  const simulateIntro = useMemo(() => createIntroSimulation(), []);

  const result = useSuspenseQuery({
    queryKey: ['panoMapManager'],
    queryFn: async () => {
      await manager.startup;
      return manager;
    }
  });

  const sphereRef = useRef<THREE.Mesh>(null);
  const lastDragAtRef = useRef(0);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (Date.now() - lastDragAtRef.current < POST_DRAG_CLICK_SUPPRESS_MS) return;
    onClick?.(e);
  };

  return (
    <motion.div className="w-full h-full rounded-lg relative overflow-clip border border-[#E9DFD5] bg-white">
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Canvas
          camera={result.data.camera}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          onCreated={({ gl }) => {
            gl.domElement.style.position = 'absolute';
            gl.domElement.style.inset = '0';
            gl.domElement.style.width = '100%';
            gl.domElement.style.height = '100%';
          }}
        >
          <Controls
            state={state}
            controlOptions={controlOptions}
            simulate={simulateIntro}
            onInteractionEnd={(wasDrag, value) => {
              if (wasDrag) {
                lastDragAtRef.current = Date.now();
              }
              onInteractionEnd?.(wasDrag, value);
            }}
          />
          <mesh ref={sphereRef} scale={[-1, 1, 1]} onClick={handleClick}>
            <sphereGeometry args={sphere} />
            <meshBasicMaterial side={THREE.BackSide} map={result.data.texture} color="#ffffff" />
          </mesh>
          {children}
        </Canvas>
      </motion.div>
    </motion.div>
  );
};

export function panTiltToPoint(pan: number, tilt: number, radius: number = PIP_RADIUS): THREE.Vector3 {
  return new THREE.Vector3(
    radius * Math.cos(tilt) * Math.sin(pan),
    radius * Math.sin(tilt),
    radius * Math.cos(tilt) * Math.cos(pan)
  );
}

// Converts a click on the inverted-X sphere mesh into a (pan, tilt) pair that
// `panTiltToPoint` can map back to the same world-space point.
export function pointToPanTilt(event: ThreeEvent<MouseEvent>): { x: number; y: number } {
  const localPoint = event.eventObject.worldToLocal(event.point.clone()).normalize();
  const x = Math.atan2(-localPoint.x, localPoint.z);
  const y = Math.asin(THREE.MathUtils.clamp(localPoint.y, -1, 1));
  return { x, y };
}

function Controls({
  state,
  controlOptions,
  simulate,
  onInteractionEnd
}: {
  state: ViewState;
  controlOptions: ControlOptions;
  simulate: Simulation<View>;
  onInteractionEnd?: (wasDrag: boolean, value: View) => void;
}) {
  const [value, onChange] = useWithSimulation(state, simulate);

  useViewControls({
    value,
    onChange,
    options: controlOptions,
    onInteractionEnd
  });

  return null;
}
