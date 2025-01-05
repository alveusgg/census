import { Slot } from '@radix-ui/react-slot';
import { FC, PropsWithChildren, useCallback } from 'react';
import { useGallery } from './hooks';

export const AutoplayOnHover: FC<PropsWithChildren> = ({ children }) => {
  const next = useGallery(state => state.next);
  const ref = useCallback((node: HTMLDivElement) => {
    let isAutoplaying = false;
    if (node) {
      node.addEventListener('mouseenter', () => {
        if (isAutoplaying) return;
        isAutoplaying = true;
        const interval = setInterval(() => {
          next();
        }, 1000);

        node.addEventListener('mouseleave', () => {
          clearInterval(interval);
          isAutoplaying = false;
        });
      });
    }
  }, []);
  return <Slot ref={ref}>{children}</Slot>;
};
