import { DurableObject } from 'cloudflare:workers';

export class LocalState extends DurableObject {
  constructor(ctx: any, env: any) {
    super(ctx, env);
    ctx.storage.sql.exec(
      'CREATE TABLE IF NOT EXISTS records (collection TEXT NOT NULL, id TEXT NOT NULL, json TEXT NOT NULL, PRIMARY KEY(collection, id))',
    );
  }
  async fetch(request: Request) {
    const { operation, collection, id, value, expectedRevision } = (await request.json()) as any;
    if (!/^[a-z][a-z-]{0,40}$/.test(collection))
      return Response.json({ error: 'Invalid collection' }, { status: 400 });
    const sql = this.ctx.storage.sql;
    if (operation === 'list') {
      const rows = sql.exec('SELECT json FROM records WHERE collection = ?', collection).toArray();
      return Response.json(rows.map((row: any) => JSON.parse(row.json)));
    }
    const row = sql
      .exec('SELECT json FROM records WHERE collection = ? AND id = ?', collection, id)
      .toArray()[0];
    const previous = row ? JSON.parse(row.json as string) : null;
    if (operation === 'get') return Response.json(previous);
    if (expectedRevision !== undefined && (previous?.revision || 0) !== expectedRevision)
      return Response.json(
        { error: 'This item changed. Refresh before saving.', code: 'CONFLICT' },
        { status: 409 },
      );
    if (operation === 'delete') {
      sql.exec('DELETE FROM records WHERE collection = ? AND id = ?', collection, id);
      return Response.json({ deleted: true });
    }
    if (operation !== 'put') return Response.json({ error: 'Unknown operation' }, { status: 400 });
    const record = {
      ...value,
      id,
      createdAt: previous?.createdAt || Date.now(),
      updatedAt: Date.now(),
      revision: (previous?.revision || 0) + 1,
    };
    sql.exec(
      'INSERT INTO records(collection,id,json) VALUES(?,?,?) ON CONFLICT(collection,id) DO UPDATE SET json=excluded.json',
      collection,
      id,
      JSON.stringify(record),
    );
    return Response.json(record);
  }
}
export default {
  async fetch(request: Request, env: any) {
    if (request.headers.get('authorization') !== env.RUNTIME_TOKEN)
      return new Response('Unauthorized', { status: 401 });
    return env.STATE.getByName('local-user').fetch(request);
  },
};
