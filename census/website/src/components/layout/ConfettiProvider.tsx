import { Portal } from '@radix-ui/react-portal';
import { FC, PropsWithChildren, createContext, useCallback, useContext, useState } from 'react';
import Confetti from 'react-confetti';

const ConfettiContext = createContext<(() => void) | null>(null);
export const ConfettiProvider: FC<PropsWithChildren> = ({ children }) => {
  const [isRunning, setIsRunning] = useState(false);

  const run = useCallback(() => {
    setIsRunning(true);
  }, [setIsRunning]);

  return (
    <ConfettiContext.Provider value={run}>
      <Portal container={document.getElementById('confetti')}>
        <div className="fixed inset-0 z-50 pointer-events-none">
          {isRunning && <Confetti recycle={false} onConfettiComplete={() => setIsRunning(false)} />}
        </div>
      </Portal>

      {children}
    </ConfettiContext.Provider>
  );
};

export const useConfetti = () => {
  const context = useContext(ConfettiContext);
  if (!context) {
    throw new Error('useConfetti must be used within a ConfettiProvider');
  }
  return context;
};
