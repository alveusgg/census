import { useVariable } from '@alveusgg/backstage';
import { ReactPlugin } from '@microsoft/applicationinsights-react-js';
import { ApplicationInsights, DistributedTracingModes } from '@microsoft/applicationinsights-web';
import { FC, PropsWithChildren, createContext, useEffect, useMemo, useState } from 'react';
import { StoreApi, createStore } from 'zustand';
import { Variables } from '../backstage/config';

import { build } from '~build/meta';
import now from '~build/time';

export interface NetworkInformation extends EventTarget {
  readonly effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
}

declare global {
  interface Navigator {
    readonly connection?: NetworkInformation;
  }
  interface Window {
    appInsights: ApplicationInsights;
  }
}

export interface AppInsightsStore {
  userId?: string;
  getSessionId: () => string | undefined;
  trackException: (exception: Error) => void;
  addAuthenticatedUserContext: (userId: string) => void;
  trackEvent: (event: string, properties?: { [key: string]: string }) => void;
  trackMetric: (name: string, value: number, properties?: { [key: string]: string }) => void;
}
export const AppInsightsContext = createContext<StoreApi<AppInsightsStore> | null>(null);

export const AppInsightsProvider: FC<PropsWithChildren> = ({ children }) => {
  const connectionString = useVariable<Variables>('appInsightsConnectionString');

  const [appInsights] = useState<ApplicationInsights>(() => {
    const reactPlugin = new ReactPlugin();
    const insights = new ApplicationInsights({
      config: {
        connectionString,
        enableAutoRouteTracking: true,
        extensions: [reactPlugin],
        // Without GDPR consent, we can't store any data related to analytics
        isStorageUseDisabled: true,

        // We can able end-to-end correlation with the backend with the following settings
        enableCorsCorrelation: true,
        distributedTracingMode: DistributedTracingModes.W3C,

        // We can add additional context to the request
        addRequestContext: () => ({
          // In chrome & edge, the network information API is available
          // This gives an approximate indication of the network quality
          networkQuality: window?.navigator.connection?.effectiveType ?? 'Unknown',

          // We can also add the build information to the request
          buildId: build ?? 'Unknown',
          builtAt: now?.toISOString()
        })
      }
    });
    return insights;
  });

  const store = useMemo(
    () =>
      createStore<AppInsightsStore>((set, get) => ({
        getSessionId: () => {
          if (!appInsights) {
            return 'No session in development';
          }
          return appInsights?.context?.getSessionId();
        },
        trackException: (exception: Error) => {
          if (!appInsights.appInsights.isInitialized()) {
            console.error(exception);
            return;
          }
          const { userId } = get();
          if (userId) {
            appInsights.setAuthenticatedUserContext(userId);
          }

          appInsights.trackException({ exception });
        },
        addAuthenticatedUserContext: (userId: string) => {
          set({ userId });

          if (!appInsights.appInsights.isInitialized()) {
            console.warn(`AppInsights is not enabled in development or hasn't been initialized`);
            return;
          }
          appInsights.setAuthenticatedUserContext(userId);
        },
        trackEvent: (event: string, properties?: { [key: string]: string }) => {
          if (!appInsights.appInsights.isInitialized()) {
            console.warn(`AppInsights is not enabled in development: ${event}`);
            return;
          }
          const { userId } = get();
          if (userId) {
            appInsights.setAuthenticatedUserContext(userId);
          }
          appInsights.trackEvent({ name: event }, properties);
        },
        trackMetric: (name: string, value: number, properties?: { [key: string]: string }) => {
          if (!appInsights.appInsights.isInitialized()) {
            console.warn(`AppInsights is not enabled in development: ${name}`);
            return;
          }
          appInsights.trackMetric({ name, average: value }, properties);
        }
      })),
    [appInsights]
  );

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.warn('AppInsights is not enabled in development');
      return;
    }

    if (appInsights.appInsights.isInitialized()) {
      return;
    }

    appInsights.loadAppInsights();
    const { userId } = store.getState();
    if (userId) {
      console.info(`Setting authenticated user context to ${userId} in initialization`);
      appInsights.setAuthenticatedUserContext(userId);
    }
    window.appInsights = appInsights;

    // There are some exceptions that are "valid" and we don't want to track them
    // This is because it takes up app insights quota and we want "exception" to be
    // a signal that something is wrong
    const hasExceptionRegex = /exception/i;
    // If the exception message matches any of these regexes, we don't track it
    const FilteredExceptions: RegExp[] = [/ResizeObserver/];

    appInsights.addTelemetryInitializer(envelope => {
      if (hasExceptionRegex.test(envelope.name)) {
        console.debug(`Envelope is an exception`);
        if (FilteredExceptions.some(exception => envelope.data?.message && exception.test(envelope.data.message))) {
          console.debug(`Envelope is a filtered exception`);
          return false;
        }
        console.debug(`Did not filter the exception`);
        return true;
      }
    });
  }, [appInsights, store]);

  return <AppInsightsContext.Provider value={store}>{children}</AppInsightsContext.Provider>;
};
