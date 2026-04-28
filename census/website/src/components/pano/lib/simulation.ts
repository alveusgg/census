import { useFrame, type RootState } from '@react-three/fiber';
import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import * as THREE from 'three';

export type SimulationResult<TValue> = {
  value: TValue;
  done?: boolean;
  reset?: () => void;
};

export type Simulation<TValue> = (
  frame: RootState,
  gl: THREE.WebGLRenderer,
  value: TValue
) => SimulationResult<TValue>;

export function useWithSimulation<TValue>(
  state: [TValue, Dispatch<SetStateAction<TValue>>],
  simulate: Simulation<TValue>
) {
  const [controlledValue, setControlledValue] = state;
  const [value, setValue] = useState(controlledValue);
  const isSimulationRunningRef = useRef(true);
  const resetSimulationRef = useRef<(() => void) | null>(null);

  const stopSimulation = useCallback((options: { reset: boolean } = { reset: true }) => {
    if (!isSimulationRunningRef.current) return;
    isSimulationRunningRef.current = false;
    if (options.reset) {
      resetSimulationRef.current?.();
    }
    resetSimulationRef.current = null;
  }, []);

  const onChange = useCallback(
    (nextValue: TValue) => {
      stopSimulation();
      setValue(nextValue);
      setControlledValue(nextValue);
    },
    [setControlledValue, stopSimulation]
  );

  useEffect(
    () => () => {
      resetSimulationRef.current?.();
      resetSimulationRef.current = null;
    },
    []
  );

  useFrame(frame => {
    if (isSimulationRunningRef.current) {
      const result = simulate(frame, frame.gl, controlledValue);
      resetSimulationRef.current = result.reset ?? resetSimulationRef.current;
      setValue(result.value);

      if (result.done) {
        stopSimulation({ reset: false });
      }
    } else if (value !== controlledValue) {
      setValue(controlledValue);
    }
  });

  return [value, onChange] as const;
}
