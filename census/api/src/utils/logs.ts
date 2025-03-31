import { context, metrics, trace } from '@opentelemetry/api';
import { LogRecord, logs } from '@opentelemetry/api-logs';
import { useEnvironment, useUser } from './env/env.js';

export const report = (error: Error) => {
  const { telemetry } = useEnvironment();
  const user = useUser();
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttribute('ai.user.authUserId', user.id);
    span.recordException(error);
    return;
  }

  telemetry?.trackException({
    exception: error
  });
};

export const metric = (name: string, value: number, properties: Record<string, string> = {}) => {
  const user = useUser();
  const meter = metrics.getMeterProvider().getMeter('ApplicationInsightsMetrics');
  const histogram = meter.createHistogram(name);

  const ctx = context.active();

  histogram.record(
    value,
    {
      ...properties,
      'ai.user.authUserId': user.id
    },
    ctx
  );
};

export const event = (name: string, properties: Record<string, string>) => {
  const logger = logs.getLoggerProvider().getLogger('ApplicationInsightsLogs');
  const user = useUser();

  const record: LogRecord = {
    attributes: {
      ...properties,
      '_MS.baseType': 'EventData',
      'ai.user.authUserId': user.id
    },
    body: {
      name,
      version: 2
    }
  };

  logger.emit(record);
};
