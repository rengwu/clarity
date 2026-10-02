import { XMLParser } from 'fast-xml-parser';
import { createHash, randomBytes } from 'node:crypto';
import sanitize from 'sanitize-html';
import { reconcileBookmark } from './linkding';
import type { Auth } from './auth';
import type { Store } from './store';

const textEntities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

export function httpUrl(value: string) {
  const url = new URL(value);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password)
    throw new Error('Use an HTTP or HTTPS address without embedded credentials.');
  return url;
}
async function boundedText(response: Response, maximum = 3_000_000) {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > maximum) throw new Error('The response is too large to read.');
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  return Buffer.concat(chunks).toString('utf8');
}
export async function fetchPage(address: string) {
  const url = httpUrl(address);
  const response = await fetch(url, {
    signal: AbortSignal.timeout(20000),
    headers: { accept: 'text/html,text/plain,application/json' },
  });
  if (!response.ok) throw new Error(`Could not read page (${response.status})`);
  const body = await boundedText(response);
  const title = body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || response.url;
  return {
    url: response.url,
    title: sanitize(title, { allowedTags: [] }),
    text: sanitize(body.replace(/<\/(p|div|article|h[1-6]|li|tr)>/gi, '\n'), {
      allowedTags: [],
      allowedAttributes: {},
    })
      .trim()
      .slice(0, 30000),
    truncated: body.length > 30000,
  };
}

export class Integrations {
  private linkdingTask?: Promise<any>;
  private refreshTimer?: ReturnType<typeof setInterval>;
  private refreshCheck?: Promise<void>;
  private nextRefresh = 0;
  private refreshMinutes = 0;
  private stopping = false;
  constructor(
    private auth: Auth,
    private store: Store,
    private changed: () => void = () => {},
  ) {}
  async configure(provider: string, args: any) {
    if (provider === 'navidrome') {
      const url = httpUrl(args.url).toString().replace(/\/$/, '');
      if (!args.username || !args.password) throw new Error('Enter the username and password.');
      const config = {
        url,
        username: String(args.username),
        password: String(args.password),
      };
      await this.navidrome('ping', {}, config);
      await this.auth.secrets.set(provider, config);
    } else if (provider === 'linkding') {
      const url = httpUrl(args.url).toString().replace(/\/$/, '');
      if (!args.token) throw new Error('Enter your Linkding API token.');
      const response = await fetch(`${url}/api/bookmarks/?limit=1`, {
        headers: { Authorization: `Token ${args.token}` },
        signal: AbortSignal.timeout(15000),
        redirect: 'error',
      }).catch(() => {
        throw new Error('Could not reach Linkding. Check the server address and your connection.');
      });
      if (!response.ok) throw new Error(`Linkding connection failed (${response.status})`);
      await this.auth.secrets.set(provider, { url, token: args.token });
    } else throw new Error('Unknown connection');
    return this.auth.status();
  }
  importLinkding() {
    if (this.linkdingTask) return this.linkdingTask;
    this.linkdingTask = this.refreshLinkding()
      .then(async (result) => {
        await this.store.put('connection-state', 'linkding', {
          lastRun: Date.now(),
          result,
        });
        return result;
      })
      .catch(async (error) => {
        await this.store.put('connection-state', 'linkding', {
          lastRun: Date.now(),
          error: error.message,
        });
        throw error;
      })
      .finally(() => {
        this.linkdingTask = undefined;
        this.changed();
      });
    return this.linkdingTask;
  }
  async linkdingStatus() {
    return {
      ...(await this.store.get('connection-state', 'linkding')),
      nextRun: this.nextRefresh,
      running: !!this.linkdingTask,
    };
  }
  async start() {
    this.stopping = false;
    await this.checkRefresh();
    this.refreshTimer = setInterval(() => void this.checkRefresh().catch(() => {}), 60000);
  }
  checkRefresh(now = Date.now()) {
    if (this.refreshCheck) return this.refreshCheck;
    this.refreshCheck = this.scheduleRefresh(now).finally(() => {
      this.refreshCheck = undefined;
    });
    return this.refreshCheck;
  }
  private async scheduleRefresh(now: number) {
    if (this.stopping) return;
    const settings = await this.store.get('settings', 'default');
    const minutes =
      settings?.enabled?.includes('bookmarks') && this.auth.secrets.get('linkding')
        ? settings.linkdingRefreshMinutes || 0
        : 0;
    if (minutes !== this.refreshMinutes) {
      this.refreshMinutes = minutes;
      this.nextRefresh = minutes ? now + minutes * 60000 : 0;
      this.changed();
    }
    if (!this.nextRefresh || now < this.nextRefresh) return;
    this.nextRefresh = now + minutes * 60000;
    await this.importLinkding();
  }
  async stop() {
    this.stopping = true;
    clearInterval(this.refreshTimer);
    await this.refreshCheck?.catch(() => {});
    await this.linkdingTask?.catch(() => {});
  }
  private async refreshLinkding() {
    const config = this.auth.secrets.get('linkding');
    if (!config) throw new Error('Connect Linkding in Settings.');
    const existing = await this.store.list('bookmarks');
    const urls = new Set(existing.map((item) => item.url));
    let address: string | null = `${config.url}/api/bookmarks/?limit=100`;
    let imported = 0,
      updated = 0,
      preserved = 0,
      unchanged = 0;
    for (let page = 0; address && page < 100; page++) {
      if (new URL(address).origin !== new URL(config.url).origin)
        throw new Error('Linkding returned a pagination link to another host.');
      const response = await fetch(address, {
        headers: { Authorization: `Token ${config.token}` },
        signal: AbortSignal.timeout(20000),
        redirect: 'error',
      });
      if (!response.ok) throw new Error(`Linkding import failed (${response.status})`);
      const data = (await response.json()) as any;
      for (const item of data.results || []) {
        const incoming = {
          title: item.title || item.url,
          url: httpUrl(item.url).toString(),
          description: item.description || '',
          tags: item.tag_names || [],
        };
        const legacyId = `linkding-${item.id}`;
        const legacy = existing.find((bookmark) => bookmark.id === legacyId);
        const id =
          legacy && (!legacy.sourceOrigin || legacy.sourceOrigin === config.url)
            ? legacyId
            : `linkding-${createHash('sha256').update(config.url).digest('hex').slice(0, 12)}-${item.id}`;
        for (let attempt = 0; attempt < 5; attempt++) {
          const current = await this.store.get('bookmarks', id);
          try {
            if (current) {
              const merged = reconcileBookmark(current, incoming);
              if (merged.changed || !current.sourceOrigin)
                await this.store.put(
                  'bookmarks',
                  id,
                  { ...merged.next, sourceOrigin: config.url },
                  current.revision,
                );
              if (merged.updated) updated++;
              if (merged.preserved) preserved++;
              if (!merged.updated && !merged.preserved) unchanged++;
            } else if (!urls.has(incoming.url)) {
              await this.store.put(
                'bookmarks',
                id,
                {
                  ...incoming,
                  sourceValues: incoming,
                  sourceOrigin: config.url,
                  source: 'linkding',
                  sourceCreatedAt: item.date_added,
                },
                0,
              );
              urls.add(incoming.url);
              imported++;
            } else unchanged++;
            break;
          } catch (error: any) {
            if (error.code !== 'CONFLICT' || attempt === 4) throw error;
          }
        }
      }
      address = data.next ? new URL(data.next, config.url).toString() : null;
    }
    return { imported, updated, preserved, unchanged, truncated: !!address };
  }
  async refreshNews() {
    const sources = await this.store.list('news-sources');
    const errors: string[] = [];
    let imported = 0;
    for (const source of sources.filter((source) => source.enabled !== false)) {
      try {
        const response = await fetch(httpUrl(source.url), {
          signal: AbortSignal.timeout(20000),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const xml = await boundedText(response);
        if (/<!DOCTYPE|<!ENTITY/i.test(xml))
          throw new Error('Feeds with external entities are not supported');
        const data = new XMLParser({
          ignoreAttributes: false,
          processEntities: true,
        }).parse(xml);
        let entries = data.rss?.channel?.item || data.feed?.entry || data['rdf:RDF']?.item || [];
        if (!Array.isArray(entries)) entries = [entries];
        for (const entry of entries.slice(0, 100)) {
          const links = Array.isArray(entry.link) ? entry.link : [entry.link];
          const link = links.find(
            (item: any) =>
              typeof item === 'string' || !item?.['@_rel'] || item['@_rel'] === 'alternate',
          );
          const address = typeof link === 'string' ? link : link?.['@_href'];
          if (!address) continue;
          const url = httpUrl(new URL(address, source.url).toString()).toString();
          const id = createHash('sha256')
            .update(source.id + url)
            .digest('hex')
            .slice(0, 24);
          const title = sanitize(String(entry.title?.['#text'] || entry.title || url), {
            allowedTags: [],
          }).replace(/&(amp|lt|gt|quot|apos);/g, (_, entity: string) => textEntities[entity]);
          const previous = await this.store.get('news', id);
          if (previous) {
            if (previous.title !== title)
              await this.store.put('news', id, { ...previous, title }, previous.revision);
            continue;
          }
          await this.store.put('news', id, {
            title,
            url,
            source: source.title || new URL(source.url).hostname,
            sourceId: source.id,
            published:
              Date.parse(entry.pubDate || entry.published || entry.updated || '') || Date.now(),
          });
          imported++;
        }
      } catch (error: any) {
        errors.push(`${source.title || source.url}: ${error.message}`);
      }
    }
    const articles = (await this.store.list('news')).sort((a, b) => b.published - a.published);
    for (const article of articles.slice(2000)) await this.store.delete('news', article.id);
    return { imported, errors };
  }
  private async gmail(path: string) {
    const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, {
      headers: { Authorization: `Bearer ${await this.auth.token('google')}` },
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error(`Gmail request failed (${response.status})`);
    return response.json() as Promise<any>;
  }
  async inbox(pageToken = '', query = '') {
    const queryParams = new URLSearchParams({
      maxResults: '30',
      ...(query ? { q: query } : { labelIds: 'INBOX' }),
      ...(pageToken ? { pageToken } : {}),
    });
    const page = await this.gmail(`messages?${queryParams}`);
    const messages: any[] = [];
    for (let offset = 0; offset < (page.messages || []).length; offset += 5) {
      const batch = await Promise.all(
        page.messages.slice(offset, offset + 5).map(async (entry: any) => {
          const data = await this.gmail(
            `messages/${encodeURIComponent(entry.id)}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          );
          const header = (name: string) =>
            data.payload?.headers?.find(
              (item: any) => item.name.toLowerCase() === name.toLowerCase(),
            )?.value || '';
          return {
            id: data.id,
            subject: header('Subject') || '(No subject)',
            from: header('From'),
            date: header('Date'),
            snippet: data.snippet,
            unread: data.labelIds?.includes('UNREAD'),
          };
        }),
      );
      messages.push(...batch);
    }
    return { messages, nextPage: page.nextPageToken || null };
  }
  async mail(id: string) {
    const data = await this.gmail(`messages/${encodeURIComponent(id)}?format=full`);
    const header = (name: string) =>
      data.payload?.headers?.find((item: any) => item.name.toLowerCase() === name.toLowerCase())
        ?.value || '';
    const parts: any[] = [];
    const walk = (part: any) => {
      if (part.body?.data) parts.push(part);
      for (const child of part.parts || []) walk(child);
    };
    walk(data.payload);
    const plain = parts.find((part) => part.mimeType === 'text/plain');
    const html = parts.find((part) => part.mimeType === 'text/html');
    const text = plain
      ? Buffer.from(plain.body.data, 'base64url').toString('utf8')
      : html
        ? sanitize(Buffer.from(html.body.data, 'base64url').toString('utf8'), {
            allowedTags: [],
          })
        : data.snippet;
    return {
      id,
      subject: header('Subject') || '(No subject)',
      from: header('From'),
      date: header('Date'),
      text,
    };
  }
  async navidrome(
    method: string,
    args: Record<string, any> = {},
    config = this.auth.secrets.get('navidrome'),
    range?: string,
  ): Promise<any> {
    if (!config) throw new Error('Connect Navidrome in Settings.');
    const salt = randomBytes(12).toString('hex');
    const token = createHash('md5')
      .update(config.password + salt)
      .digest('hex');
    const url = new URL(`${config.url}/rest/${method}.view`);
    url.search = new URLSearchParams({
      u: config.username,
      t: token,
      s: salt,
      v: '1.16.1',
      c: 'Clarity',
      f: 'json',
      ...Object.fromEntries(Object.entries(args).map(([key, value]) => [key, String(value)])),
    }).toString();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        redirect: 'error',
        headers: range ? { Range: range } : undefined,
      });
    } catch (error) {
      const code = (error as { cause?: { code?: string } })?.cause?.code;
      if (controller.signal.aborted || code === 'ETIMEDOUT' || code === 'UND_ERR_CONNECT_TIMEOUT')
        throw new Error('Navidrome took too long to respond. Check the server and try again.');
      if (code === 'ECONNREFUSED')
        throw new Error(
          'Navidrome refused the connection. Check that the server is running and the port is correct.',
        );
      if (code === 'ENOTFOUND' || code === 'EAI_AGAIN')
        throw new Error(
          'Could not find the Navidrome server. Check its address and your network connection.',
        );
      if (['EHOSTUNREACH', 'ENETUNREACH', 'EACCES', 'EPERM'].includes(code || ''))
        throw new Error(
          'The Navidrome server is unreachable. Check its address and your network connection.' +
            (process.platform === 'darwin'
              ? ' Also allow Clarity in System Settings → Privacy & Security → Local Network, then try again.'
              : ''),
        );
      throw new Error('Couldn’t reach Navidrome. Check the server address and your connection.');
    } finally {
      clearTimeout(timer);
    }
    if (!response.ok) throw new Error(`Navidrome request failed (${response.status})`);
    if (method === 'stream' || method === 'getCoverArt') return response;
    const data = ((await response.json()) as any)['subsonic-response'];
    if (data?.status !== 'ok')
      throw new Error(data?.error?.message || 'Navidrome returned an invalid response');
    return data;
  }
  async spotify(path: string, method = 'GET', body?: any) {
    const request = (token: string) =>
      fetch(`https://api.spotify.com/v1/${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(20000),
      });
    const token = await this.auth.token('spotify');
    let response = await request(token);
    if (response.status === 401) {
      await response.body?.cancel();
      response = await request(await this.auth.token('spotify', token));
    }
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as any;
      const reason =
        typeof data?.error?.message === 'string' ? data.error.message.trim().slice(0, 300) : '';
      throw new Error(`Spotify request failed (${response.status})${reason ? `: ${reason}` : ''}`);
    }
    return response.status === 204 ? {} : (response.json() as Promise<any>);
  }
}
