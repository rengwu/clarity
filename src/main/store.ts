import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { readFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { RecordValue } from '../shared/types';

export class Store {
  private runtime!: Miniflare;
  private token = randomUUID();
  constructor(
    readonly root: string,
    private workerPath: string,
  ) {}
  async start() {
    await mkdir(join(this.root, '.clarity'), { recursive: true });
    const options = convertV4MiniflareOptions({
      modules: true,
      script: await readFile(this.workerPath, 'utf8'),
      compatibilityDate: '2026-09-21',
      cf: false,
      durableObjects: { STATE: { className: 'LocalState', useSQLite: true } },
      bindings: { RUNTIME_TOKEN: this.token },
      host: '127.0.0.1',
      port: 0,
    });
    options.resourcePersistencePath = join(this.root, '.clarity', 'state');
    this.runtime = new Miniflare(options);
    await this.runtime.ready;
  }
  private async call<T>(
    operation: string,
    collection: string,
    id = '',
    value?: any,
    expectedRevision?: number,
  ): Promise<T> {
    const response = await this.runtime.dispatchFetch('http://local/state', {
      method: 'POST',
      headers: { authorization: this.token },
      body: JSON.stringify({ operation, collection, id, value, expectedRevision }),
    });
    const result = (await response.json()) as any;
    if (!response.ok) throw Object.assign(new Error(result.error), { code: result.code });
    return result as T;
  }
  list<T extends RecordValue = RecordValue>(collection: string) {
    return this.call<T[]>('list', collection);
  }
  get<T extends RecordValue = RecordValue>(collection: string, id: string) {
    return this.call<T | null>('get', collection, id);
  }
  put<T extends RecordValue = RecordValue>(
    collection: string,
    id: string,
    value: any,
    expectedRevision?: number,
  ) {
    return this.call<T>('put', collection, id, value, expectedRevision);
  }
  delete(collection: string, id: string, expectedRevision?: number) {
    return this.call('delete', collection, id, undefined, expectedRevision);
  }
  async patch<T extends RecordValue = RecordValue>(
    collection: string,
    id: string,
    changes: Partial<T>,
  ) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const current = await this.get<T>(collection, id);
      if (!current) throw new Error('Item was not found.');
      try {
        return await this.put<T>(collection, id, { ...current, ...changes }, current.revision);
      } catch (error: any) {
        if (error.code !== 'CONFLICT' || attempt === 4) throw error;
      }
    }
    throw new Error('This item is busy. Try again.');
  }
  close() {
    return this.runtime?.dispose();
  }
}
