import { motion } from 'framer-motion';
import { ComponentProps, FC } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '@/utils/cn';
import { useWrapped } from './hooks';
import { positionKey, selectActiveIndex } from './store';

export interface WrappedProgressProps extends ComponentProps<'div'> {
  /** Applied to every segment track. */
  segmentClassName?: string;
  /** Applied to every segment fill. */
  fillClassName?: string;
}

/**
 * Segmented progress bar. Sections share the width equally; a section with
 * steps is subdivided equally between them. Colour follows `currentColor`, so
 * set it with a text colour utility (e.g. `text-amber-400`).
 *
 * The active segment sweeps over the step's `wait`, and while autoplaying
 * keeps sweeping through the dwell so it lands on full exactly as the
 * presentation advances.
 */
export const WrappedProgress: FC<WrappedProgressProps> = ({ className, segmentClassName, fillClassName, ...props }) => {
  const sections = useWrapped(state => state.sections);
  const { activeIndex, activeKey, startedAt, autoplay, dwell } = useWrapped(
    useShallow(state => {
      const activeIndex = selectActiveIndex(state);
      return {
        activeIndex,
        activeKey: activeIndex === -1 ? null : state.positions[activeIndex].key,
        startedAt: state.startedAt,
        autoplay: state.autoplay,
        dwell: state.dwell
      };
    })
  );
  const positions = useWrapped(state => state.positions);
  const indexByKey = new Map(positions.map((position, index) => [position.key, index]));

  return (
    <div className={cn('flex h-2 w-full gap-2', className)} {...props}>
      {sections.map(section => {
        if (section.steps.length === 0) return null;
        return (
          <div key={section.id} className="flex min-w-0 flex-1 gap-1">
            {section.steps.map(step => {
              const key = positionKey(section.id, step.id);
              const index = indexByKey.get(key) ?? -1;
              const status = index < activeIndex ? 'done' : key === activeKey ? 'active' : 'pending';
              const total = status === 'active' ? positions[index].wait + (autoplay ? dwell : 0) : 0;
              return (
                <Segment
                  key={key}
                  status={status}
                  total={total}
                  startedAt={startedAt}
                  className={segmentClassName}
                  fillClassName={fillClassName}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

interface SegmentProps {
  status: 'pending' | 'active' | 'done';
  /** Milliseconds the active sweep covers in total, measured from `startedAt`. */
  total: number;
  startedAt: number;
  className?: string;
  fillClassName?: string;
}

const Segment: FC<SegmentProps> = ({ status, total, startedAt, className, fillClassName }) => {
  const active = status === 'active';
  // Pick up from wherever the sweep already is, so toggling autoplay mid-step doesn't jump back to zero.
  const elapsed = active ? Date.now() - startedAt : 0;
  const fraction = active && total > 0 ? Math.min(1, elapsed / total) : active ? 1 : 0;
  const remaining = active ? (total * (1 - fraction)) / 1000 : 0.2;
  // Remount the fill whenever this segment (re)activates or its sweep length changes.
  const key = active ? `active-${startedAt}-${total}` : status;

  return (
    <div className={cn('relative min-w-0 flex-1 overflow-hidden rounded-full', className)}>
      <div className="absolute inset-0 bg-current opacity-20" />
      <motion.div
        key={key}
        className={cn('absolute inset-y-0 left-0 bg-current', fillClassName)}
        initial={active ? { width: `${fraction * 100}%` } : false}
        animate={{ width: status === 'pending' ? '0%' : '100%' }}
        transition={{ duration: remaining, ease: 'linear' }}
      />
    </div>
  );
};
