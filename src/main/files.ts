import {
  mkdir,
  readdir,
  readFile,
  writeFile,
  rename,
  stat,
  lstat,
  realpath,
  copyFile,
  unlink,
  rm,
} from 'node:fs/promises';
import { join, resolve, dirname, relative, extname, basename, sep } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import type { Note, Document, Attachment } from '../shared/types';

const hash = (text: string | Buffer) => createHash('sha256').update(text).digest('hex');
function visibleDocumentPath(path: string) {
  if (
    typeof path !== 'string' ||
    path.split('/').some((part) => part.startsWith('.') || part.toLowerCase() === 'assets')
  )
    throw new Error('Document and folder names cannot start with a dot or use the assets folder.');
}
export class Files {
  private saves = new Map<string, Promise<any>>();
  constructor(readonly root: string) {}
  async initialize() {
    for (const folder of ['Notes', 'Wiki', 'Attachments', 'Trash', '.clarity'])
      await mkdir(join(this.root, folder), { recursive: true });
  }
  async path(area: string, input: string, allowMissing = false) {
    if (!['Notes', 'Wiki', 'Attachments', 'Trash'].includes(area))
      throw new Error('Invalid file area');
    if (typeof input !== 'string' || input.includes('\0') || input.includes('\\'))
      throw new Error('Invalid path');
    const root = resolve(this.root, area);
    if ((await lstat(root)).isSymbolicLink())
      throw new Error('Module folders cannot be symbolic links');
    const path = resolve(root, input);
    if (path !== root && !path.startsWith(root + sep))
      throw new Error('Path is outside this folder');
    let cursor = root;
    for (const segment of relative(root, path).split(sep).filter(Boolean)) {
      cursor = join(cursor, segment);
      try {
        if ((await lstat(cursor)).isSymbolicLink())
          throw new Error('Symbolic links are not supported');
      } catch (error: any) {
        if (!(allowMissing && error.code === 'ENOENT')) throw error;
      }
    }
    return path;
  }
  async list(area: 'Notes' | 'Wiki', query = '') {
    const items: Note[] = [];
    const walk = async (folder: string) => {
      for (const entry of await readdir(await this.path(area, folder), {
        withFileTypes: true,
      })) {
        if (entry.name.startsWith('.') || entry.isSymbolicLink() || entry.name === 'assets')
          continue;
        const path = [folder, entry.name].filter(Boolean).join('/');
        if (entry.isDirectory()) {
          if (!query) items.push({ path, title: entry.name, modified: 0, folder: true });
          await walk(path);
        } else if (entry.name.endsWith('.md')) {
          const absolute = await this.path(area, path);
          const info = await stat(absolute);
          if (
            query &&
            !path.toLowerCase().includes(query.toLowerCase()) &&
            (info.size > 5_000_000 ||
              !(await readFile(absolute, 'utf8')).toLowerCase().includes(query.toLowerCase()))
          )
            continue;
          items.push({
            path,
            title: basename(path, '.md'),
            modified: info.mtimeMs,
            folder: false,
          });
        }
      }
    };
    await walk('');
    return items.sort((a, b) => a.path.localeCompare(b.path));
  }
  async read(area: 'Notes' | 'Wiki', path: string): Promise<Document> {
    if (!path.endsWith('.md')) throw new Error('Only Markdown documents can be edited');
    const absolute = await this.path(area, path);
    if ((await stat(absolute)).size > 5_000_000)
      throw new Error('This document exceeds the 5 MB editor limit');
    const text = await readFile(absolute, 'utf8');
    return { path, text, version: hash(text) };
  }
  async create(area: 'Notes' | 'Wiki', folder = '', title = 'Untitled') {
    if (!title.trim() || /[\\/\0]/.test(title)) throw new Error('Invalid document name');
    const base = title.replace(/\.md$/i, '');
    for (let number = 0; number < 10000; number++) {
      const path = [folder, `${base}${number ? ` ${number}` : ''}.md`].filter(Boolean).join('/');
      visibleDocumentPath(path);
      try {
        await writeFile(await this.path(area, path, true), '', { flag: 'wx' });
        return this.read(area, path);
      } catch (error: any) {
        if (error.code !== 'EEXIST') throw error;
      }
    }
    throw new Error('Choose another document name');
  }
  async save(
    area: 'Notes' | 'Wiki',
    path: string,
    text: string,
    version: string,
    preserveDraft = false,
  ) {
    if (typeof text !== 'string' || Buffer.byteLength(text) > 5_000_000)
      throw new Error('Document is too large');
    const key = `${area}/${path}`;
    const previous = this.saves.get(key) || Promise.resolve();
    const task = previous
      .catch(() => {})
      .then(async () => {
        const current = await this.read(area, path);
        if (current.version !== version) {
          let copy: Document | undefined;
          if (preserveDraft) {
            copy = await this.create(
              area,
              dirname(path) === '.' ? '' : dirname(path),
              `${basename(path, '.md')} (conflict ${new Date().toISOString().replace(/[:.]/g, '-')})`,
            );
            await writeFile(await this.path(area, copy.path), text);
          }
          throw Object.assign(
            new Error(
              copy
                ? `Your draft was saved as ${copy.path}. The original changed externally.`
                : 'This document changed. Read it again before editing.',
            ),
            { code: 'CONFLICT', details: { copy: copy?.path, current } },
          );
        }
        const destination = await this.path(area, path);
        const temporary = join(dirname(destination), `.${randomUUID()}.tmp`);
        try {
          await writeFile(temporary, text, { flag: 'wx' });
          if (hash(await readFile(destination)) !== version)
            throw Object.assign(
              new Error('The document changed while saving. Your draft is still in the editor.'),
              { code: 'CONFLICT' },
            );
          await rename(temporary, destination);
        } finally {
          await unlink(temporary).catch(() => {});
        }
        return { path, text, version: hash(text) };
      });
    this.saves.set(key, task);
    try {
      return await task;
    } finally {
      if (this.saves.get(key) === task) this.saves.delete(key);
    }
  }
  async move(area: 'Notes' | 'Wiki', from: string, to: string) {
    if (!from?.endsWith('.md') || !to?.endsWith('.md'))
      throw new Error('Only Markdown documents can be renamed');
    visibleDocumentPath(to);
    const destination = await this.path(area, to, true);
    try {
      await lstat(destination);
      throw new Error('A file with that name already exists');
    } catch (error: any) {
      if (error.code !== 'ENOENT') throw error;
    }
    await rename(await this.path(area, from), destination);
    return { path: to };
  }
  async folder(area: 'Notes' | 'Wiki', path: string) {
    visibleDocumentPath(path);
    await mkdir(await this.path(area, path, true), { recursive: true });
    return { path };
  }
  async trash(area: 'Notes' | 'Wiki', path: string) {
    if (!path?.endsWith('.md')) throw new Error('Only Markdown documents can be moved to Trash');
    const destination = join(this.root, 'Trash', `${Date.now()}-${randomUUID()}-${basename(path)}`);
    await rename(await this.path(area, path), destination);
    return { trashed: path };
  }
  async attach(
    name: string,
    bytes: Buffer,
    mime = 'application/octet-stream',
  ): Promise<Attachment> {
    if (bytes.length >= 30_000_000)
      throw new Error(`${name} was skipped: attachments must be smaller than 30 MB.`);
    const id = randomUUID();
    const clean = basename(name)
      .replace(/[\0\\]/g, '_')
      .replace(/^\.+/, 'attachment-')
      .slice(0, 240);
    if (!clean) throw new Error('Attachment name is required');
    const folder = join(this.root, 'Attachments', id);
    await mkdir(folder, { recursive: true });
    await writeFile(join(folder, clean), bytes);
    const supported =
      /\.(md|txt|csv|json|js|ts|tsx|jsx|py|rs|go|html|css|yaml|yml|toml|xml|sh|sql|log|pdf|png|jpg|jpeg|webp|gif)$/i.test(
        clean,
      );
    const record = {
      id,
      name: clean,
      size: bytes.length,
      mime,
      createdAt: Date.now(),
      supported,
    };
    await writeFile(join(folder, '.metadata.json'), JSON.stringify(record));
    return record;
  }
  async attachment(id: string) {
    if (!/^[\da-f-]{36}$/i.test(id)) throw new Error('Invalid attachment ID.');
    try {
      const record: Attachment = JSON.parse(
        await readFile(await this.path('Attachments', `${id}/.metadata.json`), 'utf8'),
      );
      if (
        record.id !== id ||
        basename(record.name) !== record.name ||
        record.name.includes('\\') ||
        !Number.isFinite(record.createdAt) ||
        Date.now() - record.createdAt >= 90 * 86400000
      )
        throw new Error('Unavailable');
      const path = await this.path('Attachments', `${id}/${record.name}`);
      return { record, path };
    } catch {
      throw new Error('This attachment is unavailable or has expired after 90 days.');
    }
  }
  async previewAttachment(id: string) {
    const { record, path } = await this.attachment(id);
    const image = /\.(png|jpe?g|gif|webp)$/i.test(record.name);
    const isText =
      /\.(md|txt|csv|json|js|ts|tsx|jsx|py|rs|go|html|css|yaml|yml|toml|xml|sh|sql|log)$/i.test(
        record.name,
      );
    const contents = isText ? await readFile(path, 'utf8') : '';
    return {
      ...record,
      image,
      text: contents.slice(0, 100000),
      truncated: contents.length > 100000,
    };
  }
  async asset(area: 'Notes' | 'Wiki', documentPath: string, name: string, bytes: Buffer) {
    if (!/\.(png|jpe?g|gif|webp)$/i.test(name))
      throw new Error('Use a PNG, JPEG, GIF, or WebP image');
    await this.read(area, documentPath);
    if (bytes.length >= 30_000_000) throw new Error('Image exceeds the 30 MB limit');
    const folder = dirname(documentPath) === '.' ? '' : dirname(documentPath);
    const asset = [folder, 'assets', `${randomUUID()}${extname(name).toLowerCase()}`]
      .filter(Boolean)
      .join('/');
    const target = await this.path(area, asset, true);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, bytes);
    return {
      path: asset,
      markdown: `![${basename(name).replace(/[\[\]]/g, '')}](assets/${basename(asset)})`,
    };
  }
  async embed(area: 'Notes' | 'Wiki', documentPath: string, attachmentId: string, version: string) {
    if (!/^[\da-f-]{36}$/i.test(attachmentId)) throw new Error('Invalid attachment ID');
    const document = await this.read(area, documentPath);
    if (document.version !== version)
      throw new Error('The document changed. Read it again before embedding this attachment.');
    let attachment: Attachment;
    try {
      attachment = JSON.parse(
        await readFile(await this.path('Attachments', `${attachmentId}/.metadata.json`), 'utf8'),
      );
    } catch {
      throw new Error('This chat attachment is unavailable or expired.');
    }
    const original = await this.path('Attachments', `${attachmentId}/${attachment.name}`);
    const folder = dirname(documentPath) === '.' ? '' : dirname(documentPath);
    const asset = [folder, 'assets', `${randomUUID()}${extname(attachment.name).toLowerCase()}`]
      .filter(Boolean)
      .join('/');
    const target = await this.path(area, asset, true);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(original, target);
    const image = /\.(png|jpe?g|gif|webp)$/i.test(attachment.name);
    const label = attachment.name.replace(/[\[\]\\\r\n]/g, '');
    const markdown = `${image ? '!' : ''}[${label}](assets/${encodeURIComponent(basename(asset))})`;
    try {
      const saved = await this.save(
        area,
        documentPath,
        `${document.text.trimEnd()}\n\n${markdown}\n`,
        version,
      );
      return { ...saved, asset };
    } catch (error) {
      await unlink(target).catch(() => {});
      throw error;
    }
  }
  async cleanup(now = Date.now()) {
    for (const entry of await readdir(join(this.root, 'Attachments'), {
      withFileTypes: true,
    })) {
      if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
      const directory = join(this.root, 'Attachments', entry.name);
      try {
        const record = JSON.parse(await readFile(join(directory, '.metadata.json'), 'utf8'));
        if (typeof record.createdAt === 'number' && now - record.createdAt > 90 * 86400000)
          await rm(directory, { recursive: true });
      } catch {}
    }
    for (const entry of await readdir(join(this.root, 'Trash'), {
      withFileTypes: true,
    })) {
      const timestamp = Number(entry.name.split('-')[0]);
      if (!entry.isSymbolicLink() && timestamp > 0 && now - timestamp > 30 * 86400000)
        await rm(join(this.root, 'Trash', entry.name), {
          recursive: true,
          force: true,
        });
    }
  }
}
