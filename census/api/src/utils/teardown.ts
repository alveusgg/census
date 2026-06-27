import { InternalServerError } from '@alveusgg/error';
import { context, SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import Queue from 'p-queue';

interface TearDownFn {
  name: string;
  fn: () => Promise<void>;
}

let isShuttingDown = false;
export const tearDown = async (jobs: TearDownFn[]): Promise<() => void> => {
  return async () => {
    try {
      if (isShuttingDown) return;
      isShuttingDown = true;

      console.log(`Shutting down: ${jobs.map(job => job.name).join(', ')}`);
      for (const job of jobs) {
        console.log(`Tearing down ${job.name}`);
        await job.fn();
        console.log(`Torn down ${job.name}`);
      }
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

  return new Promise<T>((resolve, reject) => {
    const toError = (error: unknown) =>
      error instanceof Error ? error : new InternalServerError(`Long operation failed: ${String(error)}`);
    const rejectWithError = (error: unknown) => reject(toError(error));

    void longOperations
      .add(async () => {
        try {
          const result = await tracer.startActiveSpan(
            'Long Operation',
            { attributes: { name }, kind: SpanKind.INTERNAL },
            ctx,
            async span => {
              console.log(`Starting long operation ${name}`);
              try {
                const result = await fn();
                span.setStatus({ code: SpanStatusCode.OK });
                return result;
              } catch (error) {
                if (error instanceof Error) {
                  span.recordException(error);
                  span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
                } else {
                  span.setStatus({ code: SpanStatusCode.ERROR });
                }
                throw error;
              } finally {
                console.log(`Finished long operation ${name}`);
                span.end();
              }
            }
          );
          resolve(result);
        } catch (error) {
          const rejection = toError(error);
          reject(rejection);
          throw rejection;
        }
      })
      .catch(rejectWithError);
  });
};

export const waitForLongOperations = async () => {
  await longOperations.onIdle();
};
