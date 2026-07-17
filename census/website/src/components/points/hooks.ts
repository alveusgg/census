import { sleep } from '@/lib/animate';
import { useBankPoints } from '@/services/points/PointsProvider';
import { createId } from '@/utils/id';
import { animate } from 'framer-motion';
import { useCallback, useMemo, useRef, useState } from 'react';

export const usePointAction = () => {
  const bankPoints = useBankPoints();
  const [id] = useState(createId);
  const textRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const exhaustedRef = useRef(false);

  const [isPending, setIsPending] = useState(false);

  const add = useCallback(
    async (value: number) => {
      if (exhaustedRef.current) return;
      exhaustedRef.current = true;
      setIsPending(true);

      try {
        const bubble = bubbleRef.current;
        if (bubble?.isConnected) {
          try {
            await animate(bubble, { opacity: 0, top: -15, scale: 0.5 });
            await animate(bubble, { opacity: 1, top: -30, scale: 1 });
            await Promise.all([
              animate(0, value, {
                duration: 1,
                onUpdate(value) {
                  if (!textRef.current) return;
                  textRef.current.textContent = Math.round(value).toString();
                }
              }),
              animate(bubble, { scale: 1.3 }, { duration: 1 })
            ]);

            await animate(bubble, { scale: 0.9 }, { duration: 0.1 });
            await animate(bubble, { scale: 1 }, { duration: 0.1 });
            await sleep(200);
          } catch {
            // The action can outlive its component. The points update is not
            // allowed to fail just because its decorative animation vanished.
          }
        }

        bankPoints(id, value);
        await sleep(100);
      } finally {
        setIsPending(false);
      }
    },
    [bankPoints, id]
  );

  return useMemo(() => ({ add, id, bubbleRef, textRef, isPending }), [add, id, bubbleRef, textRef, isPending]);
};
