import { createContext } from 'react';
import { WrappedStoreApi } from './store';

export const WrappedContext = createContext<WrappedStoreApi | null>(null);

export interface SectionContextValue {
  id: string;
}

export interface StepContextValue {
  id: string;
  sectionId: string;
}

export const SectionContext = createContext<SectionContextValue | null>(null);
export const StepContext = createContext<StepContextValue | null>(null);
