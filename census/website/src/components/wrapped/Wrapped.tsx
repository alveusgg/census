import { FC, PropsWithChildren, useEffect, useRef } from 'react';
import { WrappedContext } from './context';
import { useWrapped } from './hooks';
import { createWrappedStore, selectActive, WrappedStoreApi } from './store';

export interface WrappedProps {
  /** Called when `next()` is triggered on the final step. */
  onComplete?: () => void;
  /** Milliseconds a ready step lingers before autoplay advances. Defaults to 3000. */
  dwell?: number;
}

/**
 * Root of a "wrapped" style presentation. Owns the zustand store that tracks
 * registered sections/steps, the active position, its wait timer and autoplay.
 *
 * @example
 * <Wrapped onComplete={close}>
 *   <WrappedProgress className="h-2 text-amber-400" />
 *   <Section>
 *     <Step wait={2000}><Intro /></Step>
 *   </Section>
 *   <Section>
 *     <Step wait={1000}><Stat /></Step>
 *     <Step wait={1500}><Chart /></Step>
 *   </Section>
 *   <WrappedNext>Next</WrappedNext>
 * </Wrapped>
 */
export const Wrapped: FC<PropsWithChildren<WrappedProps>> = ({ children, onComplete, dwell }) => {
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const store = useRef<WrappedStoreApi>();
  if (!store.current) {
    store.current = createWrappedStore({ onComplete: () => onCompleteRef.current?.(), dwell });
  }

  return (
    <WrappedContext.Provider value={store.current}>
      <WaitTimer />
      <AutoplayTimer />
      {children}
    </WrappedContext.Provider>
  );
};

/** Flips `ready` once the active position's `wait` has elapsed. */
const WaitTimer: FC = () => {
  const key = useWrapped(state => selectActive(state)?.key);
  const wait = useWrapped(state => selectActive(state)?.wait ?? 0);
  const startedAt = useWrapped(state => state.startedAt);
  const markReady = useWrapped(state => state.markReady);

  useEffect(() => {
    if (key === undefined) return;
    if (wait <= 0) {
      markReady(key);
      return;
    }
    const remaining = Math.max(0, wait - (Date.now() - startedAt));
    const timeout = setTimeout(() => markReady(key), remaining);
    return () => clearTimeout(timeout);
  }, [key, wait, startedAt, markReady]);

  return null;
};

/** While autoplaying, advances `dwell` ms after the active position became ready. */
const AutoplayTimer: FC = () => {
  const key = useWrapped(state => selectActive(state)?.key);
  const wait = useWrapped(state => selectActive(state)?.wait ?? 0);
  const startedAt = useWrapped(state => state.startedAt);
  const ready = useWrapped(state => state.ready);
  const autoplay = useWrapped(state => state.autoplay);
  const dwell = useWrapped(state => state.dwell);
  const next = useWrapped(state => state.next);

  useEffect(() => {
    if (key === undefined || !ready || !autoplay) return;
    // Measure from when the step started so toggling autoplay mid-step doesn't restart the dwell.
    const remaining = Math.max(0, wait + dwell - (Date.now() - startedAt));
    const timeout = setTimeout(() => next(), remaining);
    return () => clearTimeout(timeout);
  }, [key, wait, startedAt, ready, autoplay, dwell, next]);

  return null;
};
