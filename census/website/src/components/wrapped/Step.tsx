import { AnimatePresence, motion, Variants } from 'framer-motion';
import { FC, PropsWithChildren, useContext, useEffect, useId, useMemo } from 'react';
import { SectionContext, StepContext } from './context';
import { useWrapped, useWrappedPositionFor } from './hooks';
import { selectActive, WrappedDirection } from './store';

export interface StepProps {
  /** Milliseconds before `next()` may leave this step. Defaults to the parent Section's `wait`. */
  wait?: number;
  /** Stable identifier; defaults to a generated id. */
  id?: string;
  /**
   * Play the slide transition when entering and leaving. Set false for steps
   * that only reveal more of the previous step's content. Defaults to true.
   */
  animate?: boolean;
  /** Applied to the wrapper that hosts the step's children. */
  className?: string;
}

interface TransitionCustom {
  direction: WrappedDirection;
  instant: boolean;
}

const variants: Variants = {
  enter: ({ direction, instant }: TransitionCustom) =>
    instant ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: 56 * direction, scale: 0.98 },
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  },
  exit: ({ direction, instant }: TransitionCustom) =>
    instant
      ? { opacity: 0, transition: { duration: 0 } }
      : { opacity: 0, x: -56 * direction, scale: 0.98, transition: { duration: 0.22, ease: 'easeIn' } }
};

/**
 * A navigable position inside a Section. Registers itself on mount and only
 * mounts its children while active, sliding them in and out in the direction
 * of travel. Registration lives on the Step itself, so unmounting children
 * never affects the progress bar or navigation.
 */
export const Step: FC<PropsWithChildren<StepProps>> = ({ children, wait, id: explicitId, animate = true, className }) => {
  const section = useContext(SectionContext);
  if (!section) {
    throw new Error('<Step> must be rendered inside a <Section>');
  }

  const generatedId = useId();
  const id = explicitId ?? generatedId;
  const sectionId = section.id;
  const register = useWrapped(state => state.registerStep);
  const unregister = useWrapped(state => state.unregisterStep);

  useEffect(() => {
    register(sectionId, id, { wait, animate });
  }, [sectionId, id, wait, animate, register]);

  useEffect(() => () => unregister(sectionId, id), [sectionId, id, unregister]);

  const value = useMemo(() => ({ id, sectionId }), [id, sectionId]);
  const { visible } = useWrappedPositionFor({ sectionId, stepId: id });
  const direction = useWrapped(state => state.direction);
  // When the step taking over doesn't animate, this one must leave instantly too, or both show at once.
  const activeAnimates = useWrapped(state => selectActive(state)?.animate ?? true);

  const exitCustom: TransitionCustom = { direction, instant: !activeAnimates };
  const enterCustom: TransitionCustom = { direction, instant: !animate };

  return (
    <StepContext.Provider value={value}>
      <AnimatePresence custom={exitCustom} initial={false}>
        {visible && (
          <motion.div
            key="step"
            custom={enterCustom}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className={className}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </StepContext.Provider>
  );
};
