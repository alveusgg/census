import * as Sentry from '@sentry/node';
import { useEnvironment } from './env/env.js';

export const report = (error: Error) => {
  const { sentry } = useEnvironment();
  if (sentry) {
    sentry.captureException(error);
  }
};

export const metric = (name: string, value: number, attributes: Record<string, string> = {}) => {
  Sentry.metrics.count(name, value, { attributes });
};
