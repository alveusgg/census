import { useVariable } from '@alveusgg/backstage';
import * as Sentry from '@sentry/react';
import { FC, PropsWithChildren, useEffect } from 'react';
import { Variables } from '../backstage/config';

export const SentryProvider: FC<PropsWithChildren> = ({ children }) => {
  const sentryDSN = useVariable<Variables>('sentryDSN');
  const apiBaseUrl = useVariable<Variables>('apiBaseUrl');
  if (!sentryDSN || !apiBaseUrl) return children;

  useEffect(() => {
    Sentry.init({
      dsn: sentryDSN,
      sendDefaultPii: false,

      enableLogs: true,
      enableMetrics: true,
      tracesSampleRate: 1.0,

      tracePropagationTargets: [apiBaseUrl],

      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] })
      ]
    });

    return () => {
      Sentry.close();
    };
  }, [sentryDSN, apiBaseUrl]);

  return children;
};
