import { randomUUID } from 'node:crypto';
import { basename, dirname } from 'node:path';
import { readFile } from 'node:fs/promises';
import {
  defaultSettings,
  type Action,
  type AppEvent,
  type Settings,
  type RecordValue,
} from '../shared/types';
import type { ActionDescription } from '../vendor/cloudflare-os/gatekeeper';
import { agentActionIds, validateAutoApproveActions } from '../shared/agent-actions';
import { normalizeCalendarRule, nextFireAfter } from '../vendor/cloudflare-os/scheduler-core';
import type { Store } from './store';
import type { Files } from './files';
import type { Integrations } from './integrations';
import { httpUrl, fetchPage } from './integrations';
import type { Browser } from './browser';

export const catalog = {
  todos:
    'list; add {title,date?:YYYY-MM-DD}; update {id,title?,done?,date?:YYYY-MM-DD|null,revision}; remove {id,revision}. Date is optional; null clears it. Dated tasks appear in Calendar without creating an event.',
  notes:
    'list {query?}; read {path}; create {folder?,title?}; write {path,text,version}; embed {path,attachmentId,version}: preserve a chat attachment as a permanent copy and append its relative link; move {path,to}; folder {path}; remove {path}',
  wiki: 'list {query?}; read {path}; create {folder?,title?}: create an empty page; write {path,text,version:null for a NEW file}; embed {path,attachmentId,version}: preserve a chat attachment as a permanent copy and append its relative link; move {path,to}; folder {path}; remove {path}',
  calendar:
    'list; add {title,start,end}; update {id,title,start,end,revision}; remove {id,revision}',
  expenses:
    'list; add {amountCents,category,description,date:YYYY-MM-DD}; update {id,...same fields,revision}; remove {id,revision}',
  bookmarks:
    'list {query?}; add {title,url,description?,tags?}; update {id,...fields,revision}; remove {id,revision}; refreshLinkding; refreshX',
  news: 'list {query?}; sources; addSource {title,url}; removeSource {id,revision}; refresh',
  mail: 'list {query?,pageToken?}; read {id}. Read-only Gmail; no compose, reply, or message mutation.',
  board:
    'list {query?,after?,limit?}; read {id}; post {topic,text,threadId?,links?:[{module,id?,path?,label?}]}. Link notes/wiki by path and chats by id. Use only when instructed, including standing project instructions.',
  automations:
    'list; add {title,instruction,topicPath,hour,minute,frequency:daily|weekly,weekdays?}; update {id,...fields,revision}; remove {id,revision}',
  music:
    'search {query,type:all|song|artist|album|playlist}; library {type:albums|playlists|artists}; collection {source,id,type}; play {source,id,type}; control {action:pause|resume|next|previous|seek,position?:seconds,volume?,shuffle?,repeat?}',
};
const collections: Record<string, string> = {
  todos: 'todos',
  calendar: 'calendar',
  expenses: 'expenses',
  bookmarks: 'bookmarks',
  news: 'news',
  board: 'board',
  automations: 'automations',
};
const readers = new Set(['list', 'read', 'sources', 'library', 'search', 'collection', 'recent']);
function text(value: any, label: string, limit = 200) {
  if (typeof value !== 'string' || !value.trim() || value.length > limit)
    throw new Error(`${label} is required (maximum ${limit} characters).`);
  return value.trim();
}
function requiredRevision(value: any): number {
  if (!Number.isSafeInteger(value) || value < 1)
    throw new Error(
      'A current record revision is required. Read the item again before changing it.',
    );
  return value;
}
function validCalendarDate(value: any): boolean {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= days[month - 1];
}
function validDateTime(value: any): boolean {
  if (typeof value !== 'string') return false;
  const parts =
    /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?$/.exec(
      value,
    );
  return (
    !!parts &&
    validCalendarDate(parts[1]) &&
    Number(parts[2]) < 24 &&
    Number(parts[3]) < 60 &&
    Number(parts[4] || 0) < 60 &&
    Number.isFinite(Date.parse(value))
  );
}
export class Modules {
  private settingsWrites: Promise<any> = Promise.resolve();
  music?: { invoke: (method: string, args: any) => Promise<any> };
  onWikiChanged?: () => Promise<void>;
  constructor(
    readonly store: Store,
    readonly files: Files,
    readonly integrations: Integrations,
    readonly browser: Browser,
    private notify: (event: AppEvent) => void,
  ) {}
  async settings(): Promise<Settings> {
    return {
      ...defaultSettings,
      ...(await this.store.get('settings', 'default')),
    } as Settings;
  }
  saveSettings(changes: Partial<Settings>) {
    const task = this.settingsWrites
      .catch(() => {})
      .then(async () => {
        if (changes.autoApproveActions !== undefined)
          changes = {
            ...changes,
            autoApproveActions: validateAutoApproveActions(changes.autoApproveActions),
          };
        const settings = { ...(await this.settings()), ...changes };
        await this.store.put('settings', 'default', settings);
        this.notify({ type: 'changed', module: 'settings' });
        return settings;
      });
    this.settingsWrites = task;
    return task;
  }
  async available() {
    const settings = await this.settings();
    return Object.fromEntries(
      Object.entries(catalog).filter(([name]) => settings.enabled.includes(name as any)),
    );
  }
  async agent(owner: string, module: string, method: string, args: any, automationTopic?: string) {
    if (module === 'web') {
      if (method !== 'read') throw new Error('Unknown web method');
      return fetchPage(args.url);
    }
    if (module === 'browser') {
      const chat = await this.store.get('chats', owner);
      if (!chat) throw new Error('Interactive browsing is available in chats only.');
      if (method === 'authorize')
        return this.requestAction(owner, module, method, {
          origin: httpUrl(args.url).origin,
        });
      if (method !== 'batch') throw new Error('Unknown browser method');
      if (args.consequential !== false) return this.requestAction(owner, module, method, args);
      return this.browser.batch(owner, args.actions, chat.grants || []);
    }
    if (module === 'chats') {
      if (method !== 'find')
        throw new Error('Use chats.find when the user refers to prior discussion.');
      const query = text(args.query, 'Search text', 200).toLowerCase();
      return (await this.store.list('chats'))
        .filter((chat) => JSON.stringify(chat.messages).toLowerCase().includes(query))
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 5)
        .map((chat) => ({
          id: chat.id,
          title: chat.title,
          currentThread: chat.id === owner,
          messages: chat.messages
            .filter((message: any) => JSON.stringify(message).toLowerCase().includes(query))
            .slice(-8)
            .map((message: any) => ({
              role: message.role,
              text: JSON.stringify(message.content).slice(0, 8000),
            })),
        }));
    }
    if (readers.has(method)) return this.invoke(module, method, args);
    if (automationTopic && module === 'wiki' && method === 'write' && args.path === automationTopic)
      return this.invoke(module, method, args);
    return this.requestAction(owner, module, method, args);
  }
  private async requestAction(owner: string, module: string, method: string, args: any) {
    const actionKey = `${module}.${method}`;
    if (!agentActionIds.includes(actionKey)) throw new Error('Unknown agent action.');
    if (module !== 'browser' && !(await this.available())[module])
      throw new Error('This module is disabled.');
    const autoApproved = (await this.settings()).autoApproveActions.includes(actionKey);
    const id = randomUUID();
    const before =
      args.id && collections[module]
        ? await this.store.get(
            module === 'news' && method === 'removeSource' ? 'news-sources' : collections[module],
            args.id,
          )
        : ['notes', 'wiki'].includes(module) &&
            args.path &&
            ['write', 'move', 'remove'].includes(method)
          ? await this.files
              .read(module === 'notes' ? 'Notes' : 'Wiki', args.path)
              .catch(() => null)
          : undefined;
    const description: ActionDescription = {
      description: `${module}: ${method}`,
      descriptionIsComplete: true,
      fields: [
        {
          type: 'text',
          label: 'Arguments',
          value: JSON.stringify(args, null, 2),
        },
      ],
    } as any;
    const action = await this.store.put<Action>('actions', id, {
      owner,
      module,
      method,
      args,
      description: description.description,
      fields: description.fields,
      status: autoApproved ? 'applying' : 'pending',
      autoApproved,
      before,
    });
    this.notify({ type: 'changed', module: 'actions', id });
    if (autoApproved) return this.apply(action);
    return {
      status: 'pending-approval',
      actionId: id,
      message:
        'Queued for review. It has NOT been applied. Do not claim it is completed or submit duplicates.',
    };
  }
  async approve(id: string, apply: boolean) {
    let action = await this.store.get<Action>('actions', id);
    if (!action || action.status !== 'pending')
      throw new Error('This action is no longer pending.');
    if (!apply) {
      const result = await this.store.put(
        'actions',
        id,
        { ...action, status: 'rejected' },
        action.revision,
      );
      this.notify({ type: 'changed', module: 'actions' });
      return result;
    }
    action = await this.store.put<Action>(
      'actions',
      id,
      { ...action, status: 'applying' },
      action.revision,
    );
    this.notify({ type: 'changed', module: 'actions', id });
    return this.apply(action);
  }
  private async apply(action: Action) {
    const id = action.id;
    let result: any;
    try {
      if (action.module === 'browser') {
        const chat = await this.store.get('chats', action.owner);
        if (!chat) throw new Error('Chat no longer exists.');
        if (action.method === 'authorize') {
          const origin = httpUrl(action.args.origin).origin;
          await this.store.put(
            'chats',
            chat.id,
            { ...chat, grants: [...new Set([...(chat.grants || []), origin])] },
            chat.revision,
          );
          result = { authorized: origin };
        } else
          result = await this.browser.batch(action.owner, action.args.actions, chat.grants || []);
      } else result = await this.invoke(action.module, action.method, action.args);
      await this.store.put(
        'actions',
        id,
        { ...action, status: 'applied', result },
        action.revision,
      );
    } catch (error: any) {
      await this.store.put(
        'actions',
        id,
        { ...action, status: 'failed', error: error.message },
        action.revision,
      );
      throw error;
    } finally {
      this.notify({ type: 'changed', module: 'actions', id });
    }
    return result;
  }
  async invoke(module: string, method: string, args: any = {}) {
    if (!(await this.available())[module]) throw new Error('Enable this module in Settings.');
    const result = await this.perform(module, method, args);
    if (!readers.has(method)) this.notify({ type: 'changed', module });
    return result;
  }
  private async perform(module: string, method: string, args: any): Promise<any> {
    if (module === 'notes' || module === 'wiki') {
      const area = module === 'notes' ? 'Notes' : 'Wiki';
      if (method === 'list') return this.files.list(area, args.query || '');
      if (method === 'read') return this.files.read(area, args.path);
      let result;
      if (method === 'embed')
        result = await this.files.embed(area, args.path, args.attachmentId, args.version);
      else if (method === 'create') result = await this.files.create(area, args.folder, args.title);
      else if (method === 'write') {
        if (args.version === null && module === 'wiki') {
          if (!args.path?.endsWith('.md')) throw new Error('Use a Markdown filename.');
          const folder = dirname(args.path) === '.' ? '' : dirname(args.path);
          await this.files.folder(area, folder);
          const document = await this.files.create(area, folder, basename(args.path, '.md'));
          if (document.path !== args.path) {
            await this.files.trash(area, document.path);
            throw new Error('That page already exists. Read its current version before editing.');
          }
          result = await this.files.save(area, document.path, args.text, document.version);
        } else
          result = await this.files.save(
            area,
            args.path,
            args.text,
            args.version,
            module === 'notes' && args.preserveDraft === true,
          );
      } else if (method === 'remove') result = await this.files.trash(area, args.path);
      else if (method === 'move') result = await this.files.move(area, args.path, args.to);
      else if (method === 'folder') result = await this.files.folder(area, args.path);
      else throw new Error('Unknown document action');
      if (module === 'wiki') await this.onWikiChanged?.();
      return result;
    }
    if (module === 'mail')
      return method === 'read'
        ? this.integrations.mail(args.id)
        : method === 'list'
          ? this.integrations.inbox(args.pageToken, args.query)
          : Promise.reject(new Error('Mail is read-only.'));
    if (module === 'music') {
      if (!this.music) throw new Error('Player is starting.');
      return this.music.invoke(method, args);
    }
    if (module === 'bookmarks' && method === 'refreshLinkding')
      return this.integrations.importLinkding();
    if (module === 'bookmarks' && method === 'refreshX') {
      const result = await this.browser.xBookmarks();
      let imported = 0;
      for (const bookmark of result.bookmarks)
        if (!(await this.store.get('bookmarks', bookmark.id))) {
          await this.store.put('bookmarks', bookmark.id, bookmark);
          imported++;
        }
      return { imported, complete: result.complete };
    }
    if (module === 'news') {
      if (method === 'refresh') return this.integrations.refreshNews();
      if (method === 'sources') return this.store.list('news-sources');
      if (method === 'addSource')
        return this.store.put('news-sources', randomUUID(), {
          title: text(args.title, 'Source name'),
          url: httpUrl(args.url).toString(),
          enabled: true,
        });
      if (method === 'removeSource')
        return this.store.delete(
          'news-sources',
          text(args.id, 'ID'),
          requiredRevision(args.revision),
        );
    }
    if (module === 'board') {
      if (method === 'read') {
        const post = await this.store.get('board', args.id);
        const thread = post?.threadId ? await this.store.get('board', post.threadId) : post;
        const replies = (await this.store.list('board'))
          .filter((post) => post.threadId === thread?.id)
          .sort((a, b) => a.createdAt - b.createdAt);
        return { thread, replies };
      }
      if (method === 'post') {
        let threadId = null;
        if (args.threadId !== undefined && args.threadId !== null) {
          threadId = text(args.threadId, 'Thread ID');
          const parent = await this.store.get('board', threadId);
          if (!parent || parent.threadId != null)
            throw new Error('Reply to an existing root thread. This thread is unavailable.');
        }
        return this.store.put('board', randomUUID(), {
          topic: text(args.topic, 'Topic'),
          text: text(args.text, 'Post', 20000),
          threadId,
          links: Array.isArray(args.links) ? args.links.slice(0, 20) : [],
        });
      }
    }
    const collection = collections[module];
    if (!collection) throw new Error('Unknown module');
    if (method === 'read') {
      const item = await this.store.get(collection, text(args.id, 'ID'));
      if (!item) throw new Error('This item is no longer available.');
      return item;
    }
    if (method === 'list') {
      const all = (await this.store.list(collection)).sort(
        (a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id),
      );
      const query = String(args.query || '').toLowerCase();
      let items = query
        ? all.filter((item) => JSON.stringify(item).toLowerCase().includes(query))
        : all;
      if (module === 'board' && args.threads) {
        const matches = items;
        const ids = new Set(matches.map((item) => item.threadId || item.id));
        items = all
          .filter((item) => !item.threadId && ids.has(item.id))
          .map((item) => ({
            ...item,
            match: query ? matches.find((post) => post.threadId === item.id)?.text : undefined,
          }));
      }
      if (args.after) items = items.filter((item) => item.createdAt > Number(args.after));
      const limit = Math.max(1, Math.min(Math.floor(Number(args.limit)) || 500, 2000));
      const offset = Math.max(0, Math.floor(Number(args.offset)) || 0);
      return {
        items: items.slice(offset, offset + limit),
        truncated: offset + limit < items.length,
        total: items.length,
      };
    }
    if (method === 'remove')
      return this.store.delete(collection, text(args.id, 'ID'), requiredRevision(args.revision));
    if (!['add', 'update'].includes(method)) throw new Error('Unknown module method');
    if (method === 'update') requiredRevision(args.revision);
    const previous =
      method === 'update' ? await this.store.get(collection, text(args.id, 'ID')) : null;
    if (method === 'update' && !previous) throw new Error('Item was not found.');
    const value = { ...previous, ...args };
    delete value.revision;
    if (module === 'todos') {
      value.title = text(value.title, 'Task', 1000);
      value.done = !!value.done;
      if (value.date === undefined || value.date === null || value.date === '') value.date = null;
      else if (!validCalendarDate(value.date))
        throw new Error('Enter a valid task date (YYYY-MM-DD), or leave it empty.');
    }
    if (module === 'calendar') {
      value.title = text(value.title, 'Event title');
      if (
        !validDateTime(value.start) ||
        !validDateTime(value.end) ||
        Date.parse(value.end) <= Date.parse(value.start)
      )
        throw new Error('Enter valid start and end dates. End must be after the start.');
    }
    if (module === 'expenses') {
      if (
        !Number.isSafeInteger(value.amountCents) ||
        value.amountCents <= 0 ||
        value.amountCents > 99999999999
      )
        throw new Error('Enter a positive amount.');
      value.category = text(value.category, 'Category');
      value.description = text(value.description, 'Description', 1000);
      if (!validCalendarDate(value.date))
        throw new Error('Enter a valid expense date (YYYY-MM-DD).');
    }
    if (module === 'bookmarks') {
      value.url = httpUrl(value.url).toString();
      value.title = text(value.title, 'Title', 1000);
      value.description = String(value.description || '').slice(0, 20000);
      value.tags = Array.isArray(value.tags) ? value.tags.map(String).slice(0, 40) : [];
    }
    if (module === 'automations') {
      value.title = text(value.title, 'Automation name');
      value.instruction = text(value.instruction, 'Instructions', 12000);
      value.topicPath = text(value.topicPath, 'Wiki topic path', 500);
      await this.files.path('Wiki', value.topicPath, true);
      if (!value.topicPath.endsWith('.md')) throw new Error('Choose a Markdown wiki topic.');
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      value.schedule = normalizeCalendarRule(
        {
          freq: value.frequency === 'weekly' ? 'weekly' : 'daily',
          timeZone,
          hour: Number(value.hour),
          minute: Number(value.minute),
          ...(value.frequency === 'weekly'
            ? { byDay: value.weekdays?.length ? value.weekdays : ['MO'] }
            : {}),
        },
        Date.now(),
      );
      value.nextRun = nextFireAfter(value.schedule, Date.now());
      value.enabled = value.enabled !== false;
      value.since = previous?.since || Date.now();
    }
    return this.store.put(collection, previous?.id || randomUUID(), value, args.revision);
  }
}
