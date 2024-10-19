import { useFlag } from '@alveusgg/backstage';
import { FC, PropsWithChildren } from 'react';
import { Flags } from './config';

interface FeatureFlagProps {
  flag: Flags;
}
export const FeatureFlag: FC<PropsWithChildren<FeatureFlagProps>> = ({ flag, children }) => {
  const isEnabled = useFlag(flag);
  return isEnabled ? children : null;
};
