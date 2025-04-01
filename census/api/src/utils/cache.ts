import { BadRequestError, DownstreamError } from '@alveusgg/error';

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
