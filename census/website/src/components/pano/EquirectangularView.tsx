import { Html } from '@react-three/drei';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';

import { enablePatches } from 'immer';
enablePatches();

import { useSuspenseQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState, type FC } from 'react';
import * as THREE from 'three';
import equirectangularImage from './garden-high.jpg';
import equirectangularImageLow from './garden-low.jpg';
import { defaultPanoMapManagerOptions, PanoMapManager } from './lib/PanoMapManager';
import { usePTZCameraControls } from './PTZCameraControls';
// import wolf from './presets';

interface EquirectangularViewProps {
  sim: { x: number; y: number; fov: number };
  onSimChange?: (sim: { x: number; y: number; fov: number }) => void;
}

const INTRO_DELAY_MS = 0;
const INTRO_DURATION_MS = 3000;
const INTRO_TILT_OFFSET = THREE.MathUtils.degToRad(24);
const INTRO_FOV_OFFSET = 2;
const INTRO_START_EXPOSURE = 20;
const INTRO_END_EXPOSURE = 1;
const MIN_FOV = 4;
const MAX_FOV = 60;

const manager = new PanoMapManager(
  {
    pano: {
      low: equirectangularImageLow,
      high: equirectangularImage
    }
  },
  defaultPanoMapManagerOptions
);

import { Variables } from '@/services/backstage/config';
import { useVariable } from '@alveusgg/backstage';
import { motion } from 'framer-motion';
const sphere: [number, number, number] = [10, 64, 64];
const pipRadius = sphere[0] - 0.35;

export const EquirectangularView: FC<EquirectangularViewProps> = ({ sim, onSimChange }) => {
  const ipxBaseUrl = useVariable<Variables>('ipxBaseUrl');
  if (!ipxBaseUrl) throw new Error('ipxBaseUrl is not set');

  const result = useSuspenseQuery({
    queryKey: ['panoMapManager'],
    queryFn: async () => {
      await manager.startup;
      return manager;
    }
  });

  const sphereRef = useRef<THREE.Mesh>(null);
  const lastDragAtRef = useRef(0);

  const [location, setLocation] = useState<{ pan: number; tilt: number } | null>(null);

  const handleClick = async (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();

    if (Date.now() - lastDragAtRef.current < 250) {
      return;
    }

    const mesh = sphereRef.current;
    if (!mesh) return;

    const localPoint = mesh.worldToLocal(e.point.clone()).normalize();
    const pan = Math.atan2(-localPoint.x, localPoint.z);
    const tilt = Math.asin(THREE.MathUtils.clamp(localPoint.y, -1, 1));

    setLocation({ pan, tilt });
  };

  return (
    <motion.div className="w-full aspect-3/1 rounded-lg relative overflow-clip border border-[#E9DFD5] bg-white">
      <motion.div
        className="rounded-sm overflow-clip absolute inset-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
      >
        <Canvas camera={result.data.camera}>
          <Controls
            sim={sim}
            onSimChange={onSimChange}
            onInteractionEnd={wasDrag => {
              if (wasDrag) {
                lastDragAtRef.current = Date.now();
              }
            }}
          />
          <mesh ref={sphereRef} scale={[-1, 1, 1]} onClick={handleClick}>
            <sphereGeometry args={sphere} />
            <meshBasicMaterial side={THREE.BackSide} map={result.data.texture} color="#ffffff" />
          </mesh>
          {location && (
            <group position={panTiltToPoint(location.pan, location.tilt, pipRadius)}>
              <Html center>
                <motion.div
                  className="w-3 h-3 rounded-full border-2 border-white bg-[#AE65F7]"
                  key={location.pan.toFixed(3) + location.tilt.toFixed(3)}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: '-50%' }}
                    animate={{ opacity: 1, y: '-120%' }}
                    transition={{ duration: 0.3 }}
                    className="absolute left-1/2 -translate-x-1/2 flex w-24 text-center flex-col bg-white text-[#AE65F7] p-2 rounded-lg border-2 border-[#AE65F7]"
                  >
                    <p className="text-xs font-bold">
                      {THREE.MathUtils.radToDeg(location.pan).toFixed(0)}°,{' '}
                      {THREE.MathUtils.radToDeg(location.tilt).toFixed(0)}°
                    </p>
                  </motion.div>
                </motion.div>
              </Html>
            </group>
          )}
        </Canvas>
      </motion.div>
    </motion.div>
  );
};

function panTiltToPoint(pan: number, tilt: number, radius: number): THREE.Vector3 {
  return new THREE.Vector3(
    radius * Math.cos(tilt) * Math.sin(pan),
    radius * Math.sin(tilt),
    radius * Math.cos(tilt) * Math.cos(pan)
  );
}

function Controls({
  sim,
  onSimChange,
  onInteractionEnd
}: {
  sim: { x: number; y: number; fov: number };
  onSimChange?: (sim: { x: number; y: number; fov: number }) => void;
  onInteractionEnd?: (wasDrag: boolean) => void;
}) {
  const { gl } = useThree();
  const rendererRef = useRef(gl);
  const [displaySim, setDisplaySim] = useState(() => getIntroStartSim(sim));
  const displaySimRef = useRef(displaySim);
  const introRef = useRef({
    active: true,
    startTimeMs: null as number | null,
    from: displaySim,
    to: sim
  });

  useEffect(() => {
    displaySimRef.current = displaySim;
  }, [displaySim]);

  useEffect(() => {
    rendererRef.current = gl;
    const previousToneMapping = rendererRef.current.toneMapping;
    const previousToneMappingExposure = rendererRef.current.toneMappingExposure;

    rendererRef.current.toneMapping = THREE.ACESFilmicToneMapping;
    rendererRef.current.toneMappingExposure = INTRO_START_EXPOSURE;

    return () => {
      rendererRef.current.toneMapping = previousToneMapping;
      rendererRef.current.toneMappingExposure = previousToneMappingExposure;
    };
  }, [gl]);

  const stopIntro = () => {
    if (!introRef.current.active) return;
    introRef.current.active = false;
    introRef.current.startTimeMs = null;
    displaySimRef.current = introRef.current.to;
    setDisplaySim(introRef.current.to);
    onSimChange?.(introRef.current.to);
  };

  usePTZCameraControls({
    pan: displaySim.y,
    tilt: displaySim.x,
    fov: displaySim.fov,
    sensitivity: [0.0001, 0.002],
    invertHorizontal: true,
    invertVertical: true,
    onInteractionStart: stopIntro,
    onInteractionEnd,
    onChange: (pan, tilt) => {
      introRef.current.active = false;
      introRef.current.startTimeMs = null;
      const nextSim = { x: tilt, y: pan, fov: displaySimRef.current.fov };
      displaySimRef.current = nextSim;
      setDisplaySim(nextSim);
      onSimChange?.(nextSim);
    },
    onFovChange: fov => {
      introRef.current.active = false;
      introRef.current.startTimeMs = null;
      const nextSim = { x: displaySimRef.current.x, y: displaySimRef.current.y, fov };
      displaySimRef.current = nextSim;
      setDisplaySim(nextSim);
      onSimChange?.(nextSim);
    }
  });

  useFrame(({ clock }) => {
    let currentExposure = INTRO_END_EXPOSURE;

    if (introRef.current.active) {
      const intro = introRef.current;
      intro.to = sim;
      if (intro.startTimeMs === null) {
        intro.startTimeMs = clock.elapsedTime * 1000;
      }

      const elapsedMs = clock.elapsedTime * 1000 - intro.startTimeMs;
      const motionElapsedMs = Math.max(0, elapsedMs - INTRO_DELAY_MS);
      const progress = THREE.MathUtils.clamp(motionElapsedMs / INTRO_DURATION_MS, 0, 1);
      const easedProgress = 1 - (1 - progress) ** 3;
      const nextSim = {
        x: THREE.MathUtils.lerp(intro.from.x, intro.to.x, easedProgress),
        y: THREE.MathUtils.lerp(intro.from.y, intro.to.y, easedProgress),
        fov: THREE.MathUtils.lerp(intro.from.fov, intro.to.fov, easedProgress)
      };
      currentExposure = THREE.MathUtils.lerp(INTRO_START_EXPOSURE, INTRO_END_EXPOSURE, easedProgress);

      displaySimRef.current = nextSim;
      setDisplaySim(nextSim);

      if (progress === 1) {
        intro.active = false;
        intro.startTimeMs = null;
        onSimChange?.(intro.to);
      }
    } else if (!areSameSim(displaySimRef.current, sim)) {
      displaySimRef.current = sim;
      setDisplaySim(sim);
    }

    const currentSim = displaySimRef.current;
    manager.camera.rotation.order = 'YXZ';
    manager.camera.rotation.y = currentSim.y;
    manager.camera.rotation.x = currentSim.x;

    Object.assign(manager.camera, {
      fov: currentSim.fov
    });
    manager.camera.updateProjectionMatrix();
    rendererRef.current.toneMappingExposure = currentExposure;
  });

  return null;
}

function getIntroStartSim(sim: { x: number; y: number; fov: number }) {
  return {
    x: THREE.MathUtils.clamp(sim.x - INTRO_TILT_OFFSET, -Math.PI / 2, Math.PI / 2),
    y: sim.y,
    fov: THREE.MathUtils.clamp(sim.fov + INTRO_FOV_OFFSET, MIN_FOV, MAX_FOV)
  };
}

function areSameSim(a: { x: number; y: number; fov: number }, b: { x: number; y: number; fov: number }) {
  return a.x === b.x && a.y === b.y && a.fov === b.fov;
}

type Props = {
  distance?: number; // plane distance from origin
  fov: number; // degrees
  yaw: number; // rotation around Y (radians)
  pitch: number; // rotation around X (radians)
  label?: string;
};

export function OrientedScreenQuad({ distance = 5, fov, yaw, pitch, label }: Props) {
  const { size } = useThree();

  const fovRad = THREE.MathUtils.degToRad(fov);
  const height = 2 * Math.tan(fovRad / 2) * distance;
  const width = height * (size.width / size.height);
  const geometry = useMemo(() => new THREE.PlaneGeometry(width, height), [width, height]);

  const { position, quaternion } = useMemo(() => {
    const euler = new THREE.Euler(pitch, yaw, 0, 'YXZ');
    const q = new THREE.Quaternion().setFromEuler(euler);

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
    const pos = forward.clone().multiplyScalar(distance); // from origin

    return { position: pos, quaternion: q };
  }, [yaw, pitch, distance]);

  return (
    <group position={position} quaternion={quaternion}>
      <mesh geometry={geometry}>
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {label && (
        <Html center transform sprite>
          <div
            style={{
              color: 'white',
              background: 'rgba(0, 0, 0, 0.5)',
              fontSize: '1px',
              padding: '1px 3px',
              borderRadius: '4px',
              whiteSpace: 'nowrap',
              pointerEvents: 'auto'
            }}
          >
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}
