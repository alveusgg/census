import { Spinner } from '@/components/loaders/Spinner';
import { Variables } from '@/services/backstage/config';
import { useVariable } from '@alveusgg/backstage';
import { AnimatePresence, motion } from 'framer-motion';
import { FC, PropsWithChildren, ReactNode, useEffect } from 'react';

interface DockProps {
  actions?: ReactNode;
}

export const Dock: FC<PropsWithChildren<DockProps>> = ({ actions, children }) => {
  return (
    <div className="w-fit max-w-full relative h-28 flex items-center">
      <AnimatePresence initial={false}>
        {actions && (
          <motion.div
            initial={{ opacity: 0, top: 0 }}
            animate={{ opacity: 1, top: '-80%' }}
            exit={{ opacity: 0, top: 0 }}
            className="absolute left-1/2 z-20 -translate-x-1/2 bg-accent-300 rounded-2xl px-5 pt-4 pb-6 flex gap-3 shadow-[inset_0_-9px_0px_-0.25rem_rgba(0,0,0,0.15)]"
          >
            {actions}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center gap-2 h-20 bg-accent-300 rounded-2xl px-4 py-4 w-fit max-w-full">
        <AnimatePresence initial={false}>{children}</AnimatePresence>
      </div>
    </div>
  );
};

export const PendingIndicator: FC = () => {
  return (
    <div className="h-full w-20 aspect-square flex items-center justify-center text-accent-50">
      <Spinner />
    </div>
  );
};

interface DockKeyNavigatorProps {
  length: number;
  index?: number;
  setIndex: (index: number) => void;
}
export const DockKeyNavigator: FC<DockKeyNavigatorProps> = ({ length, index, setIndex }) => {
  useEffect(() => {
    const abortController = new AbortController();

    window.addEventListener(
      'keydown',
      e => {
        if (e.key === 'ArrowLeft') {
          if (index === undefined) {
            if (length === 0) return;
            setIndex(length - 1);
            return;
          }
          const newIndex = index - 1;
          if (newIndex < 0) {
            setIndex(length - 1);
          } else {
            setIndex(newIndex);
          }
        }

        if (e.key === 'ArrowRight') {
          if (index === undefined) {
            if (length === 0) return;
            setIndex(0);
            return;
          }
          const newIndex = index + 1;
          if (newIndex >= length) {
            setIndex(0);
          } else {
            setIndex(newIndex);
          }
        }
      },
      { signal: abortController.signal }
    );

    return () => {
      abortController.abort();
    };
  }, [length, index, setIndex]);

  return null;
};

interface PreloadImagesProps {
  images: string[];
}

export const PreloadImages: FC<PreloadImagesProps> = ({ images }) => {
  const imageResizeCDNUrl = useVariable<Variables>('imageResizeCDNUrl');

  return (
    <div style={{ height: 0, width: 0 }}>
      {images.map(image => (
        <img src={`${imageResizeCDNUrl}/quality=85/${image}`} />
      ))}
    </div>
  );
};
