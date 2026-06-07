import { InternalServerError } from '@alveusgg/error';
import postgres from 'postgres';
import { useEnvironment } from '../utils/env/env.js';

interface AcquireOptions {
  intervalMs?: number;
  signal?: AbortSignal;
}

interface LeaderContext {
  signal: AbortSignal;
}

type LeaderFn = (context: LeaderContext) => Promise<void> | void;
type ReservedConnection = Awaited<ReturnType<ReturnType<typeof postgres>['reserve']>>;

export class PostgresLeader {
  private readonly namespace: number;
  private readonly key: number;
  private readonly intervalMs: number;
  private timer?: NodeJS.Timeout;
  private reserved?: ReservedConnection;
  private controller?: AbortController;
  private acquiring = false;
  private running = false;
  private stopped = false;

  constructor(namespace: number, key: number, options: AcquireOptions = {}) {
    this.namespace = namespace;
    this.key = key;
    this.intervalMs = options.intervalMs ?? 5_000;

    if (options.signal) {
      options.signal.addEventListener('abort', () => void this.stop(), { once: true });
    }
  }

  acquire(fn: LeaderFn) {
    if (this.timer || this.running) {
      throw new InternalServerError('Leader acquisition is already running');
    }

    const tryAcquire = () => {
      void this.tryAcquire(fn).catch(error => {
        console.error(error);
        void this.release();
      });
    };

    tryAcquire();
    this.timer = setInterval(tryAcquire, this.intervalMs);
    return () => this.stop();
  }

  async stop() {
    this.stopped = true;
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    this.controller?.abort();

    while (this.running) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    await this.release();
  }

  private async tryAcquire(fn: LeaderFn) {
    if (this.stopped || this.acquiring || this.running || this.reserved) return;

    this.acquiring = true;
    let reserved: ReservedConnection | undefined;

    try {
      const { postgres } = useEnvironment();
      reserved = await postgres.reserve();
      const [response] = await reserved<{ acquired: boolean }[]>`
        SELECT pg_try_advisory_lock(${this.namespace}, ${this.key}) AS acquired
      `;

      if (!response?.acquired || this.stopped) {
        if (response?.acquired) {
          await reserved`
            SELECT pg_advisory_unlock(${this.namespace}, ${this.key})
          `;
        }
        reserved.release();
        return;
      }

      this.reserved = reserved;
      reserved = undefined;
      this.controller = new AbortController();
      this.running = true;

      try {
        await fn({ signal: this.controller.signal });
      } finally {
        this.running = false;
        this.controller = undefined;
        await this.release();
      }
    } finally {
      this.acquiring = false;
      reserved?.release();
    }
  }

  private async release() {
    const reserved = this.reserved;
    if (!reserved) return;

    this.reserved = undefined;
    await reserved`
      SELECT pg_advisory_unlock(${this.namespace}, ${this.key})
    `;
    reserved.release();
  }
}
