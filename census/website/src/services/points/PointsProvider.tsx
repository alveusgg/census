import {
  createContext,
  Dispatch,
  FC,
  PropsWithChildren,
  SetStateAction,
  useCallback,
  useContext,
  useState
} from 'react';

interface Point {
  id: string;
  value: number;
}

type PointsContextValue = [Point[], Dispatch<SetStateAction<Point[]>>];
const PointsContext = createContext<PointsContextValue | null>(null);

export const PointsProvider: FC<PropsWithChildren> = ({ children }) => {
  const state = useState<Point[]>([]);
  return <PointsContext.Provider value={state}>{children}</PointsContext.Provider>;
};

function usePoints() {
  const context = useContext(PointsContext);
  if (!context) throw new Error('usePoints must be used within a PointsProvider');
  return context;
}

export const useActions = () => {
  const [points] = usePoints();
  return points;
};

export const useBankPoints = () => {
  const [points, setPoints] = usePoints();
  return useCallback(
    (id: string, value: number) => {
      setPoints(prev => [...prev, { id, value }]);
      setTimeout(() => {
        setPoints(prev => prev.filter(point => point.id !== id));
      }, 500);
    },
    [points, setPoints]
  );
};
