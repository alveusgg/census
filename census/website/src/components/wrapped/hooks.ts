import { useContext } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { SectionContext, StepContext, WrappedContext } from './context';
import { indexOfCursor, positionKey, selectActive, selectActiveIndex, WrappedStore } from './store';

export const useWrappedStore = () => {
  const store = useContext(WrappedContext);
  if (!store) {
    throw new Error('Wrapped hooks must be used within <Wrapped>');
  }
  return store;
};

export const useWrapped = <U>(selector: (state: WrappedStore) => U): U => useStore(useWrappedStore(), selector);

export type WrappedPositionStatus = 'pending' | 'active' | 'done';

export interface WrappedPositionState {
  /** True when the nearest enclosing Step is active, or (outside a Step) when any Step of the Section is. */
  visible: boolean;
  status: WrappedPositionStatus;
  /** True when the active position's `wait` has elapsed. Only meaningful while `visible`. */
  ready: boolean;
}

/** A specific Step, or a whole Section when `stepId` is null. */
export type WrappedTarget = { sectionId: string; stepId: string | null };

const selectRange = (state: WrappedStore, target: WrappedTarget | null) => {
  const activeIndex = selectActiveIndex(state);
  if (!target) return { activeIndex, first: -1, last: -1 };
  if (target.stepId) {
    const index = indexOfCursor(state.positions, { sectionId: target.sectionId, stepId: target.stepId });
    return { activeIndex, first: index, last: index };
  }
  const indices = state.positions
    .map((position, index) => (position.sectionId === target.sectionId ? index : -1))
    .filter(index => index !== -1);
  return { activeIndex, first: indices[0] ?? -1, last: indices[indices.length - 1] ?? -1 };
};

/**
 * Lifecycle state of an explicit section or step. Used by `Section`/`Step`
 * themselves, which sit above their own context providers.
 */
export const useWrappedPositionFor = (target: WrappedTarget | null): WrappedPositionState => {
  const { activeIndex, first, last } = useWrapped(useShallow(state => selectRange(state, target)));
  const ready = useWrapped(state => state.ready);

  if (first === -1) {
    return { visible: true, status: 'active', ready };
  }

  const status: WrappedPositionStatus = activeIndex > last ? 'done' : activeIndex >= first ? 'active' : 'pending';
  return { visible: status === 'active', status, ready: status === 'active' && ready };
};

/**
 * Lifecycle state of the nearest enclosing Step or Section. Outside of both it
 * reports the whole presentation as visible.
 */
export const useWrappedPosition = (): WrappedPositionState => {
  const step = useContext(StepContext);
  const section = useContext(SectionContext);
  return useWrappedPositionFor(
    step ? { sectionId: step.sectionId, stepId: step.id } : section ? { sectionId: section.id, stepId: null } : null
  );
};

/** Whether the nearest enclosing Step or Section is currently on screen. */
export const useWrappedVisible = () => useWrappedPosition().visible;

export const useWrappedNavigation = () =>
  useWrapped(
    useShallow(state => {
      const index = selectActiveIndex(state);
      return {
        next: state.next,
        previous: state.previous,
        goTo: state.goTo,
        restart: state.restart,
        ready: state.ready,
        complete: state.complete,
        autoplay: state.autoplay,
        setAutoplay: state.setAutoplay,
        direction: state.direction,
        index,
        total: state.positions.length,
        isFirst: index <= 0,
        isLast: index === state.positions.length - 1
      };
    })
  );

export { positionKey, selectActive, selectActiveIndex };
