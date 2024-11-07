import { sleep } from '@/lib/animate';
import { useBankPoints } from '@/services/points/PointsProvider';
import { animate } from 'framer-motion';
import { useCallback, useMemo, useRef, useState } from 'react';

export const usePointAction = () => {
  const bankPoints = useBankPoints();
  const [id] = useState(() => crypto.randomUUID());
  const textRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const exhaustedRef = useRef(false);

  const add = useCallback(
    async (value: number) => {
      if (!bubbleRef.current) throw new Error('bubble ref is not set');
      if (exhaustedRef.current) return;
      exhaustedRef.current = true;

      await animate(bubbleRef.current, { opacity: 0, top: -15, scale: 0.5 });
      await animate(bubbleRef.current, { opacity: 1, top: -30, scale: 1 });
      await Promise.all([
        animate(0, value, {
          duration: 1,
          onUpdate(value) {
            if (!textRef.current) return;
            textRef.current.textContent = Math.round(value).toString();
          }
        }),
        animate(bubbleRef.current, { scale: 1.3 }, { duration: 1 })
      ]);

      await animate(bubbleRef.current, { scale: 0.9 }, { duration: 0.1 });
      await animate(bubbleRef.current, { scale: 1 }, { duration: 0.1 });

      await sleep(200);
      bankPoints(id, value);
      await sleep(100);
      bubbleRef.current?.remove();
    },
    [id, animate, bubbleRef, textRef, bankPoints]
  );

  return useMemo(() => ({ add, id, bubbleRef, textRef }), [add, id, bubbleRef, textRef]);
};
