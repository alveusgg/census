import { Html } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import { motion } from 'framer-motion';
import { FC, useState } from 'react';
import { DEFAULT_VIEW, Pano, panTiltToPoint, pointToPanTilt, type View } from './Pano';

export interface PanoLocation {
  x: number;
  y: number;
}

interface PanoLocationInputProps {
  value: PanoLocation | null;
  onChange: (value: PanoLocation) => void;
}

export const PanoLocationInput: FC<PanoLocationInputProps> = ({ value, onChange }) => {
  const view = useState<View>(value ? { pan: value.x - Math.PI, tilt: value.y, fov: DEFAULT_VIEW.fov } : DEFAULT_VIEW);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onChange(pointToPanTilt(e));
  };

  return (
    <Pano state={view} onClick={handleClick}>
      {value && (
        <group position={panTiltToPoint(value.x, value.y)}>
          <Html center>
            <motion.div
              className="w-4 h-4 rounded-full border-2 border-white bg-[#AE65F7] shadow-md pointer-events-none"
              key={value.x.toFixed(3) + value.y.toFixed(3)}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            />
          </Html>
        </group>
      )}
    </Pano>
  );
};
