import { InternalServerError } from '@alveusgg/error';
import * as Sentry from '@sentry/node';

const DEFAULT_BASE_DELAY_MS = 10_000;
const DEFAULT_MAX_ATTEMPTS = 15;
const DEFAULT_MULTIPLIER = 2;
const DEFAULT_NAME = 'exponential-backoff';

export interface ExponentialBackoffOptions {
  name?: string;
  baseDelayMs?: number;
  maxAttempts?: number;
  multiplier?: number;
  timeoutMs: number;
}

export class ExponentialBackoffStrategy {
  private attempt = 0;
  private readonly name: string;
  private readonly baseDelayMs: number;
  private readonly maxAttempts: number;
  private readonly multiplier: number;
  private readonly timeoutMs: number;
  constructor(options: ExponentialBackoffOptions) {
    this.name = options.name ?? DEFAULT_NAME;
    this.baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
    this.maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
    this.multiplier = options.multiplier ?? DEFAULT_MULTIPLIER;
    this.timeoutMs = options.timeoutMs;
  }

  async wait() {
    const delay = this.attempt === 0 ? 0 : this.baseDelayMs * this.multiplier ** (this.attempt - 1);

    return Sentry.startSpan(
      {
        name: `${this.name}.wait`,
        op: 'backoff.wait',
        attributes: this.attributes({ delayMs: delay })
      },
      async () => {
        Sentry.addBreadcrumb({
          category: 'backoff',
          level: 'info',
          message: `${this.name} waiting before retry`,
          data: this.attributes({ delayMs: delay })
        });
        Sentry.metrics.count('backoff.wait', 1, { attributes: this.metricAttributes() });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    );
  }

  async timeout() {
    await new Promise(resolve => setTimeout(resolve, this.timeoutMs));
  }

  success() {
    Sentry.startSpan(
      {
        name: `${this.name}.success`,
        op: 'backoff.success',
        attributes: this.attributes()
      },
      () => {
        Sentry.metrics.count('backoff.success', 1, { attributes: this.metricAttributes() });
        this.attempt = 0;
      }
    );
  }

  failure(error?: unknown) {
    const nextAttempt = this.attempt + 1;
    Sentry.startSpan(
      {
        name: `${this.name}.failure`,
        op: 'backoff.failure',
        attributes: this.attributes({ nextAttempt, exhausted: nextAttempt >= this.maxAttempts })
      },
      span => {
        Sentry.metrics.count('backoff.failure', 1, { attributes: this.metricAttributes() });

        if (nextAttempt >= this.maxAttempts) {
          const retryError = this.toError(error);

          span.setStatus({ code: 2, message: 'max_attempts_exhausted' });
          Sentry.captureException(retryError, {
            tags: {
              component: this.name
            },
            contexts: {
              backoff: this.attributes({ exhausted: true })
            }
          });
          throw retryError;
        }

        this.attempt = nextAttempt;
      }
    );
  }

  private attributes(extra: Record<string, number | boolean | string> = {}) {
    return {
      name: this.name,
      attempt: this.attempt,
      baseDelayMs: this.baseDelayMs,
      maxAttempts: this.maxAttempts,
      multiplier: this.multiplier,
      ...extra
    };
  }

  private metricAttributes() {
    return {
      name: this.name,
      attempt: String(this.attempt)
    };
  }

  private toError(error: unknown) {
    if (error instanceof Error) return error;

    return new InternalServerError(`${this.name} exhausted after ${this.maxAttempts} attempts`);
  }
}
