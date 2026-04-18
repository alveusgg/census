import { Button } from '@/components/controls/button/paper';
import { cn } from '@/utils/cn';
import { AnimatePresence, motion } from 'framer-motion';
import { FC, PropsWithChildren } from 'react';
import { useSelection } from './SelectionProvider';

export const SelectionActionBar: FC<PropsWithChildren<{ className?: string }>> = ({ children, className }) => {
  const { selection } = useSelection();

  return (
    <AnimatePresence>
      {selection.length > 0 && (
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed bottom-2 z-40 px-2 left-0 right-0"
        >
          <div
            className={cn(
              'mx-auto flex w-full max-w-3xl items-center gap-2 rounded-xl border border-accent-700/20 bg-white/90 p-2 shadow-xl backdrop-blur',
              className
            )}
          >
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const SelectionCount: FC<{ singular?: string; plural?: string }> = ({
  singular = 'item',
  plural = `${singular}s`
}) => {
  const { selection } = useSelection();
  const count = selection.length;

  return (
    <p className="px-2 text-sm font-semibold text-accent-900">
      {count} {count === 1 ? singular : plural} selected
    </p>
  );
};

export const ClearSelectionButton = () => {
  const { clearSelection } = useSelection();
  return (
    <Button compact onClick={clearSelection} className="ml-auto">
      clear
    </Button>
  );
};
