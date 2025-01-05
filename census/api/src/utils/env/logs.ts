import { context, SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';

export const withTrace = <T>(name: string, fn: () => T) => {
  const tracer = trace.getTracer('ApplicationInsightsTracer');
  const ctx = context.active();
  return tracer.startActiveSpan(name, { kind: SpanKind.INTERNAL }, ctx, async span => {
    try {
      return fn();
    } catch (error) {
      if (error instanceof Error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      } else {
        span.setStatus({ code: SpanStatusCode.ERROR });
      }
      span.end();
      throw error;
    }
  });
};
