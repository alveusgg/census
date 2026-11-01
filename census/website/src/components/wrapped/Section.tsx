import { FC, PropsWithChildren, useEffect, useId, useMemo } from 'react';
import { SectionContext } from './context';
import { useWrapped } from './hooks';

export interface SectionProps {
  /** Default `wait` (ms) for child Steps that don't set their own. */
  wait?: number;
  /** Stable identifier; defaults to a generated id. */
  id?: string;
}

/**
 * A top-level group of Steps. Sections are purely structural: they always
 * render their children and get equal width in `WrappedProgress`, subdivided
 * by their Steps. Every Section needs at least one Step to be navigable.
 */
export const Section: FC<PropsWithChildren<SectionProps>> = ({ children, wait = 0, id: explicitId }) => {
  const generatedId = useId();
  const id = explicitId ?? generatedId;
  const register = useWrapped(state => state.registerSection);
  const unregister = useWrapped(state => state.unregisterSection);

  useEffect(() => {
    register(id, wait);
  }, [id, wait, register]);

  useEffect(() => () => unregister(id), [id, unregister]);

  const value = useMemo(() => ({ id }), [id]);
  return <SectionContext.Provider value={value}>{children}</SectionContext.Provider>;
};
