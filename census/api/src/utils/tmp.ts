import { mkdirSync } from 'fs';
import { unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const Cache = new Map<string, Promise<TemporaryFile>>();

export const getTemporaryFile = (filename: string) => {
  if (Cache.has(filename)) return Cache.get(filename);
};

export class TemporaryFile {
  private createdAt?: Date;
  private ttl: number;
  dir: string;
  path: string;
  name: string;
  constructor(name: string, dir: string, path: string, ttl: number) {
    this.ttl = ttl;
    this.name = name;
    this.dir = dir;
    this.path = path;
  }

  static async create(filename: string, ttl: number, createCallbackFn: (file: TemporaryFile) => Promise<void>) {
    const name = filename.replace(/\//g, '_');
    const dir = join(tmpdir(), 'census');
    mkdirSync(dir, { recursive: true });
    const path = join(dir, name);
    const file = new TemporaryFile(name, dir, path, ttl);

    // The reason we do this weird createCallbackFn is because we want to avoid a race condition where
    // the file is created but not yet written to. During this time, other requests for the same file
    // will redo work because it's not found in the cache yet.

    // This avoids that by caching the promise instead of the file object and having that promise wait for the file to be written.

    const promise = createCallbackFn(file)
      .then(() => file)
      .catch(async err => {
        console.error(err);
        await file.delete();
        throw err;
      });
    Cache.set(path, promise);
    return promise;
  }

  static async createMany(
    filenames: string[],
    ttl: number,
    createCallbackFn: (result: Record<string, TemporaryFile>) => Promise<void>
  ) {
    const record: Record<string, TemporaryFile> = {};
    filenames.forEach(filename => {
      const name = filename.replace(/\//g, '_');
      const dir = join(tmpdir(), 'census');
      mkdirSync(dir, { recursive: true });
      const path = join(dir, name);
      const file = new TemporaryFile(name, dir, path, ttl);
      record[filename] = file;
    });

    for (const filename of filenames) {
      const promise = createCallbackFn(record).then(() => record[filename]);
      Cache.set(record[filename].path, promise);
    }

    return Promise.all(Object.values(record).map(file => Cache.get(file.path)));
  }

  expired() {
    if (!this.createdAt) return false;
    return this.createdAt.getTime() + this.ttl < Date.now();
  }

  async delete() {
    await unlink(this.path);
    Cache.delete(this.path);
  }
}

setInterval(() => {
  Cache.forEach(async promise => {
    const file = await promise;
    if (file.expired()) {
      await file.delete();
    }
  });
}, 30 * 1000);
