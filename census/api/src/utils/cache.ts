import { BadRequestError, DownstreamError } from '@alveusgg/error';
import { and, eq, gt, isNull, or } from 'drizzle-orm';
import { cache as cacheTable } from '../db/schema/cache.js';
import type { initialise } from '../db/db.js';

export interface KVCache {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export class CloudflareKVCache implements KVCache {
  private readonly origin: string;
  private readonly path: string;

  constructor(
    protected readonly accountId: string,
    private readonly namespace: string,
    private readonly token: string
  ) {
    this.origin = `https://api.cloudflare.com`;
    this.path = `/client/v4/accounts/${this.accountId}/storage/kv/namespaces/${this.namespace}`;
  }

  async get(key: string) {
    const url = new URL(`${this.path}/values/${key}`, this.origin);
    const data = await this.request(url, 'GET');
    return data;
  }

  async set(key: string, value: string, ttl?: number) {
    const url = new URL(`${this.path}/values/${key}`, this.origin);

    if (ttl) {
      if (ttl < 60) throw new BadRequestError('ttl must be greater than 60 seconds');
      url.searchParams.set('expiration_ttl', ttl.toString());
    }

    await this.request(url, 'PUT', value);
  }

  async delete(key: string) {
    const url = new URL(`${this.path}/values/${key}`, this.origin);
    await this.request(url, 'DELETE');
  }

  async request(url: URL, method: 'GET' | 'PUT' | 'DELETE', body?: string) {
    const response = await fetch(url, {
      method,
      body,
      headers: {
        Authorization: `Bearer ${this.token}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) return null;

      throw new DownstreamError('cloudflare', response.statusText);
    }

    return await response.text();
  }
}

// Local development version

export class LocalKVCache implements KVCache {
  private readonly cache: Map<string, { value: string; ttl?: number; setAt: number }>;

  constructor() {
    this.cache = new Map<string, { value: string; ttl?: number; setAt: number }>();
  }

  async delete(key: string) {
    this.cache.delete(key);
  }

  async get(key: string) {
    const value = this.cache.get(key);
    if (!value) return null;
    if (value.ttl && value.ttl < Date.now() - value.setAt) {
      this.cache.delete(key);
      return null;
    }
    return value.value;
  }

  async set(key: string, value: string, ttl?: number) {
    this.cache.set(key, { value, ttl, setAt: Date.now() });
  }
}

type Database = Awaited<ReturnType<typeof initialise>>['db'];

export class PostgresKVCache implements KVCache {
  constructor(private readonly db: Database) {}

  async delete(key: string) {
    await this.db.delete(cacheTable).where(eq(cacheTable.key, key));
  }

  async get(key: string) {
    const [row] = await this.db
      .select({ value: cacheTable.value })
      .from(cacheTable)
      .where(and(eq(cacheTable.key, key), or(isNull(cacheTable.expiredAt), gt(cacheTable.expiredAt, new Date()))))
      .limit(1);

    return row?.value ?? null;
  }

  async set(key: string, value: string, ttl?: number) {
    const expiredAt = ttl ? new Date(Date.now() + ttl * 1000) : null;

    await this.db.insert(cacheTable).values({ key, value, expiredAt }).onConflictDoUpdate({
      target: cacheTable.key,
      set: { value, expiredAt }
    });
  }
}

export function withCoalescing<Args extends unknown[], R>(
  fn: (...args: Args) => Promise<R>,
  options: { key: (...args: Args) => string }
): (...args: Args) => Promise<R> {
  const inFlight = new Map<string, Promise<R>>();
  return (...args: Args): Promise<R> => {
    const key = options.key(...args);
    const existing = inFlight.get(key);
    if (existing) return existing;

    const promise = fn(...args).finally(() => {
      inFlight.delete(key);
    });
    inFlight.set(key, promise);
    return promise;
  };
}
