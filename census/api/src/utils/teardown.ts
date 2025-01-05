import { context, SpanKind, trace } from '@opentelemetry/api';
import Queue from 'p-queue';
import { useEnvironment } from './env/env.js';

interface TearDownFn {
  name: string;
  fn: () => Promise<void>;
}

let isShuttingDown = false;
export const tearDown = async (jobs: TearDownFn[]): Promise<() => void> => {
  return async () => {
    try {
      const { telemetry } = useEnvironment();
      if (isShuttingDown) return;
      isShuttingDown = true;

      console.log(`Shutting down: ${jobs.map(job => job.name).join(', ')}`);
      const promises = jobs.map(job => {
        console.log(`Tearing down ${job.name}`);
        const promise = job.fn();
        return [promise, job.name] as const;
      });

      for (const [promise, name] of promises.reverse()) {
        await promise;
        console.log(`Torn down ${name}`);
      }
      await telemetry?.flush();
      await new Promise(resolve => setTimeout(resolve, 1000));
      process.exit(0);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  };
};

const longOperations = new Queue();

export const runLongOperation = <T>(fn: () => Promise<T>, name?: string): Promise<T> => {
  const tracer = trace.getTracer('ApplicationInsightsTracer');
  const ctx = context.active();
  return tracer.startActiveSpan(
    'Long Operation',
    { attributes: { name }, kind: SpanKind.INTERNAL },
    ctx,
    async span => {
      console.log(`Starting long operation ${name}`);
      const result = await fn();
      console.log(`Finished long operation ${name}`);
      span.end();
      return result;
    }
  );
};

export const waitForLongOperations = async () => {
  await longOperations.onEmpty();
};
