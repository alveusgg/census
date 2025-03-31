import { useContext, useEffect, useRef } from 'react';
import { useStore } from 'zustand';
import { AppInsightsContext, AppInsightsStore } from './AppInsightsProvider';

export function useAppInsights<U>(selector: (store: AppInsightsStore) => U): U {
  const context = useContext(AppInsightsContext);
  if (!context) {
    throw new Error('useAppInsights must be used within a AppInsightsProvider');
  }
  return useStore(context, selector);
}

export const useTrackEvent = () => useAppInsights(store => store.trackEvent);
export const useLogPage = (name: string, properties: Record<string, string>) => {
  const trackEvent = useTrackEvent();
  const ref = useRef<boolean>(false);
  useEffect(() => {
    if (ref.current) {
      trackEvent(`view:${name}`, properties);
    }
    ref.current = true;
  }, [trackEvent, name, properties]);
};
export const useAddAuthenticatedContext = () => {
  return useAppInsights(store => store.addAuthenticatedUserContext);
};

export const useSessionId = () => useAppInsights(store => store.getSessionId());
export const useTrackMetric = () => useAppInsights(store => store.trackMetric);
