import type { Observation } from '@/services/api/observations';
import { createContext, type FC, type PropsWithChildren, useContext } from 'react';

const ObservationContext = createContext<Observation | null>(null);

export const ObservationProvider: FC<PropsWithChildren<{ observation: Observation }>> = ({ children, observation }) => {
  return <ObservationContext.Provider value={observation}>{children}</ObservationContext.Provider>;
};

export const useCurrentObservation = () => {
  const observation = useContext(ObservationContext);
  if (!observation) throw new Error('Observation components must be rendered inside an ObservationProvider');
  return observation;
};
