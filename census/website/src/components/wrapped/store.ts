import { createStore } from 'zustand';

export interface WrappedStepOptions {
  /** Falls back to the parent section's `wait` when undefined. */
  wait?: number;
  /**
   * Whether entering/leaving this step plays the slide transition. Steps that
   * only reveal a little more of the previous step (e.g. podium places) set
   * this to false so the shared content doesn't swap out and back in.
   */
  animate?: boolean;
}

export interface WrappedStepEntry extends WrappedStepOptions {
  id: string;
}

export interface WrappedSectionEntry {
  id: string;
  wait: number;
  /**
   * False while the section only exists because one of its steps registered
   * first (child effects run before parent effects). Placeholder sections are
   * dropped again if all their steps unregister before the section itself does.
   */
  registered: boolean;
  steps: WrappedStepEntry[];
}

export interface WrappedCursor {
  sectionId: string;
  stepId: string;
}

/** A navigable position: one per Step, in registration order. */
export interface WrappedPosition extends WrappedCursor {
  key: string;
  wait: number;
  animate: boolean;
}

export type WrappedDirection = 1 | -1;

export interface WrappedStore {
  sections: WrappedSectionEntry[];
  positions: WrappedPosition[];
  cursor: WrappedCursor | null;
  /** `Date.now()` when the cursor last moved. */
  startedAt: number;
  /** True once the active position's `wait` has elapsed. */
  ready: boolean;
  /** True after `next()` is called on the final position. */
  complete: boolean;
  /** Which way the cursor last moved; drives the slide transition. */
  direction: WrappedDirection;
  /** When true, `next()` fires automatically `dwell` ms after a position becomes ready. */
  autoplay: boolean;
  dwell: number;

  registerSection: (id: string, wait: number) => void;
  unregisterSection: (id: string) => void;
  registerStep: (sectionId: string, stepId: string, options?: WrappedStepOptions) => void;
  unregisterStep: (sectionId: string, stepId: string) => void;
  /** Marks the active position ready, if `key` still matches it. */
  markReady: (key: string) => void;
  next: (options?: { force?: boolean }) => void;
  previous: () => void;
  goTo: (index: number) => void;
  restart: () => void;
  setAutoplay: (autoplay: boolean) => void;
}

export interface WrappedStoreOptions {
  onComplete?: () => void;
  /** Milliseconds a ready position lingers before autoplay advances. */
  dwell?: number;
}

export const positionKey = (sectionId: string, stepId: string) => `${sectionId}/${stepId}`;

export const indexOfCursor = (positions: WrappedPosition[], cursor: WrappedCursor | null) =>
  cursor
    ? positions.findIndex(position => position.sectionId === cursor.sectionId && position.stepId === cursor.stepId)
    : -1;

export const selectActiveIndex = (state: Pick<WrappedStore, 'positions' | 'cursor'>) =>
  indexOfCursor(state.positions, state.cursor);

export const selectActive = (state: Pick<WrappedStore, 'positions' | 'cursor'>): WrappedPosition | null => {
  const index = selectActiveIndex(state);
  return index === -1 ? null : state.positions[index];
};

const buildPositions = (sections: WrappedSectionEntry[]): WrappedPosition[] =>
  sections.flatMap(section =>
    section.steps.map(step => ({
      sectionId: section.id,
      stepId: step.id,
      key: positionKey(section.id, step.id),
      wait: step.wait ?? section.wait,
      animate: step.animate ?? true
    }))
  );

const toCursor = (position: WrappedPosition): WrappedCursor => ({
  sectionId: position.sectionId,
  stepId: position.stepId
});

/**
 * Recomputes positions after a registration change and keeps the cursor on a
 * valid position. If the cursor's position vanished, fall back to the nearest
 * surviving index and restart timing.
 */
const commitSections = (
  state: WrappedStore,
  sections: WrappedSectionEntry[]
): Pick<WrappedStore, 'sections' | 'positions' | 'cursor'> & Partial<Pick<WrappedStore, 'startedAt' | 'ready'>> => {
  const positions = buildPositions(sections);
  let index = indexOfCursor(positions, state.cursor);
  if (index !== -1) {
    return { sections, positions, cursor: state.cursor };
  }

  const previousIndex = indexOfCursor(state.positions, state.cursor);
  index = Math.min(Math.max(previousIndex, 0), positions.length - 1);
  const cursor = index >= 0 ? toCursor(positions[index]) : null;
  return { sections, positions, cursor, startedAt: Date.now(), ready: false };
};

export const createWrappedStore = ({ onComplete, dwell = 3000 }: WrappedStoreOptions = {}) =>
  createStore<WrappedStore>((set, get) => {
    const move = (index: number) => {
      const state = get();
      const { positions } = state;
      if (positions.length === 0) return;
      const clamped = Math.min(Math.max(index, 0), positions.length - 1);
      const current = selectActiveIndex(state);
      set({
        cursor: toCursor(positions[clamped]),
        startedAt: Date.now(),
        ready: false,
        complete: false,
        direction: clamped >= current ? 1 : -1
      });
    };

    return {
      sections: [],
      positions: [],
      cursor: null,
      startedAt: 0,
      ready: false,
      complete: false,
      direction: 1,
      autoplay: false,
      dwell,

      registerSection: (id, wait) => {
        const state = get();
        const existing = state.sections.find(section => section.id === id);
        const sections = existing
          ? state.sections.map(section => (section.id === id ? { ...section, wait, registered: true } : section))
          : [...state.sections, { id, wait, registered: true, steps: [] }];
        set(commitSections(state, sections));
      },

      unregisterSection: id => {
        const state = get();
        set(
          commitSections(
            state,
            state.sections.filter(section => section.id !== id)
          )
        );
      },

      registerStep: (sectionId, stepId, options = {}) => {
        const state = get();
        const step: WrappedStepEntry = { id: stepId, ...options };
        const exists = state.sections.some(section => section.id === sectionId);
        const sections = exists
          ? state.sections.map(section => {
              if (section.id !== sectionId) return section;
              const hasStep = section.steps.some(existing => existing.id === stepId);
              return {
                ...section,
                steps: hasStep
                  ? section.steps.map(existing => (existing.id === stepId ? step : existing))
                  : [...section.steps, step]
              };
            })
          : [...state.sections, { id: sectionId, wait: 0, registered: false, steps: [step] }];
        set(commitSections(state, sections));
      },

      unregisterStep: (sectionId, stepId) => {
        const state = get();
        const sections = state.sections.flatMap(section => {
          if (section.id !== sectionId) return [section];
          const steps = section.steps.filter(step => step.id !== stepId);
          if (steps.length === 0 && !section.registered) return [];
          return [{ ...section, steps }];
        });
        set(commitSections(state, sections));
      },

      markReady: key => {
        const active = selectActive(get());
        if (active?.key === key) set({ ready: true });
      },

      next: ({ force = false } = {}) => {
        const state = get();
        const index = selectActiveIndex(state);
        if (index === -1) return;
        if (!state.ready && !force) return;
        if (index >= state.positions.length - 1) {
          if (!state.complete) {
            set({ complete: true, autoplay: false });
            onComplete?.();
          }
          return;
        }
        move(index + 1);
      },

      previous: () => {
        const index = selectActiveIndex(get());
        if (index <= 0) return;
        move(index - 1);
      },

      goTo: move,

      restart: () => move(0),

      setAutoplay: autoplay => set({ autoplay })
    };
  });

export type WrappedStoreApi = ReturnType<typeof createWrappedStore>;
