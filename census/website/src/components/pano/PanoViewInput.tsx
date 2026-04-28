import { cn } from '@/utils/cn';
import { AnimatePresence, motion } from 'framer-motion';
import { CSSProperties, FC, useRef, useState } from 'react';
import { DEFAULT_VIEW, Pano, type View } from './Pano';
export { getPanoLocationForView, getViewBounds, normalizePan } from './viewBounds';

interface PanoViewInputProps {
  value: View;
  onChange?: (value: View) => void;
  onPointerUp?: (value: View) => void;
  active?: boolean;
  className?: string;
}

const ACTIVE_OUTLINE_COLOR = '#8B4217';

export const PanoViewInput: FC<PanoViewInputProps> = ({ value, onChange, onPointerUp, active, className }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [draftView, setDraftView] = useState<View>(value ?? DEFAULT_VIEW);

  const handleInteractionEnd = (wasDrag: boolean, nextView: View) => {
    if (!wasDrag) return;
    onChange?.(nextView);
    onPointerUp?.(nextView);
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative rounded-lg', className)}
      style={{ '--custom-color': ACTIVE_OUTLINE_COLOR } as CSSProperties}
    >
      <Pano state={[draftView, setDraftView]} onInteractionEnd={handleInteractionEnd} />
      {!active && <div className="pointer-events-none absolute inset-0 rounded-lg border-4 border-white" />}
      <AnimatePresence>
        {active && (
          <motion.div
            key="active-pano-view"
            initial={{ borderWidth: 0, boxShadow: `0 0 0 0 ${ACTIVE_OUTLINE_COLOR}` }}
            animate={{ borderWidth: 4, boxShadow: `0 0 0 6px ${ACTIVE_OUTLINE_COLOR}` }}
            exit={{ borderWidth: 0, boxShadow: `0 0 0 0 ${ACTIVE_OUTLINE_COLOR}` }}
            className="pointer-events-none absolute inset-0 rounded-lg border-solid border-white"
          />
        )}
      </AnimatePresence>
    </div>
  );
};
