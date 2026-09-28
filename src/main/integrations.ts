import { XMLParser } from 'fast-xml-parser';
import { createHash, randomBytes } from 'node:crypto';
import sanitize from 'sanitize-html';
import type { Auth } from './auth';
import type { Store } from './store';

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
  constructor(
    private auth: Auth,
    private store: Store,
  ) {}
  async configure(provider: string, args: any) {
    if (provider === 'navidrome') {
      const url = httpUrl(args.url).toString().replace(/\/$/, '');
      if (!args.username || !args.password) throw new Error('Enter the username and password.');
      const config = { url, username: String(args.username), password: String(args.password) };
      await this.navidrome('ping', {}, config);
      await this.auth.secrets.set(provider, config);
    } else if (provider === 'linkding') {
      const url = httpUrl(args.url).toString().replace(/\/$/, '');
      if (!args.token) throw new Error('Enter your Linkding API token.');
      const response = await fetch(`${url}/api/bookmarks/?limit=1`, {
        headers: { Authorization: `Token ${args.token}` },
        signal: AbortSignal.timeout(15000),
        redirect: 'error',
      });
      if (!response.ok) throw new Error(`Linkding connection failed (${response.status})`);
      await this.auth.secrets.set(provider, { url, token: args.token });
    } else throw new Error('Unknown connection');
    return this.auth.status();
  }
  async importLinkding() {
    const config = this.auth.secrets.get('linkding');
    if (!config) throw new Error('Connect Linkding in Settings.');
    const existing = await this.store.list('bookmarks');
    const urls = new Set(existing.map((item) => item.url));
    let address: string | null = `${config.url}/api/bookmarks/?limit=100`;
    let imported = 0;
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
        if (urls.has(item.url)) continue;
        httpUrl(item.url);
        await this.store.put('bookmarks', `linkding-${item.id}`, {
          title: item.title || item.url,
          url: item.url,
          description: item.description || '',
          tags: item.tag_names || [],
          source: 'linkding',
          sourceCreatedAt: item.date_added,
        });
        urls.add(item.url);
        imported++;
      }
      address = data.next ? new URL(data.next, config.url).toString() : null;
    }
    return { imported, truncated: !!address };
  }
  async refreshNews() {
    const sources = await this.store.list('news-sources');
    const errors: string[] = [];
    let imported = 0;
    for (const source of sources.filter((source) => source.enabled !== false)) {
      try {
        const response = await fetch(httpUrl(source.url), { signal: AbortSignal.timeout(20000) });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const xml = await boundedText(response);
        if (/<!DOCTYPE|<!ENTITY/i.test(xml))
          throw new Error('Feeds with external entities are not supported');
        const data = new XMLParser({ ignoreAttributes: false, processEntities: false }).parse(xml);
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
          if (await this.store.get('news', id)) continue;
          await this.store.put('news', id, {
            title: sanitize(String(entry.title?.['#text'] || entry.title || url), {
              allowedTags: [],
            }),
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
        ? sanitize(Buffer.from(html.body.data, 'base64url').toString('utf8'), { allowedTags: [] })
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
      response = await fetch(url, { signal: controller.signal, redirect: 'error' });
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
    const response = await fetch(`https://api.spotify.com/v1/${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${await this.auth.token('spotify')}`,
        'content-type': 'application/json',
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok)
      throw new Error(
        `Spotify request failed (${response.status})${response.status === 403 ? '. Check account access and Premium playback.' : ''}`,
      );
    return response.status === 204 ? {} : (response.json() as Promise<any>);
  }
}
