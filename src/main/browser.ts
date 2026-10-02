import { chromium, type BrowserContext, type Page } from 'playwright-core';
import { access, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { httpUrl } from './integrations';

export class Browser {
  private context?: BrowserContext;
  private pages = new Map<string, Page>();
  private launching?: Promise<BrowserContext>;
  private permissions = new Map<string, Set<string>>();
  private blocked = new Map<string, string>();
  private batches = new Map<string, Promise<any>>();
  private permissionVersions = new Map<string, number>();
  constructor(private root: string) {}
  async start(visible = false) {
    if (this.context) return this.context;
    if (this.launching) return this.launching;
    this.launching = (async () => {
      let executablePath: string | undefined;
      const candidates =
        process.platform === 'darwin'
          ? [
              '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
              '/Applications/Chromium.app/Contents/MacOS/Chromium',
            ]
          : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
      for (const path of candidates) {
        try {
          await access(path);
          executablePath = path;
          break;
        } catch {}
      }
      if (!executablePath)
        throw new Error(
          'Install Google Chrome or Chromium to use interactive browsing. Web page reading remains available.',
        );
      const profile = join(this.root, '.clarity', 'browser');
      await mkdir(profile, { recursive: true });
      this.context = await chromium.launchPersistentContext(profile, {
        executablePath,
        headless: !visible,
        acceptDownloads: false,
        args: ['--disable-background-networking'],
        viewport: { width: 1280, height: 900 },
      });
      this.context.on('close', () => {
        this.context = undefined;
        this.pages.clear();
      });
      return this.context;
    })().finally(() => {
      this.launching = undefined;
    });
    return this.launching;
  }
  async login(url: string) {
    httpUrl(url);
    await this.close();
    const context = await this.start(true);
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    return {
      opened: true,
      message:
        'Sign in in the browser window, then close it. Clarity will reuse this separate browser profile.',
    };
  }
  async batch(owner: string, operations: any[], grants: string[]) {
    const permissionVersion = this.permissionVersions.get(owner) || 0;
    const previous = this.batches.get(owner) || Promise.resolve();
    const task = previous
      .catch(() => {})
      .then(() => this.performBatch(owner, operations, grants, permissionVersion));
    this.batches.set(owner, task);
    try {
      return await task;
    } finally {
      if (this.batches.get(owner) === task) this.batches.delete(owner);
    }
  }
  private async performBatch(
    owner: string,
    operations: any[],
    grants: string[],
    permissionVersion: number,
  ) {
    if (!Array.isArray(operations) || operations.length < 1 || operations.length > 12)
      throw new Error('Use between 1 and 12 browser actions per batch.');
    const context = await this.start();
    if (permissionVersion !== (this.permissionVersions.get(owner) || 0))
      throw new Error(
        'Website access changed. Check this chat’s permissions before browsing again.',
      );
    let page = this.pages.get(owner);
    const allowed = new Set(grants);
    this.permissions.set(owner, allowed);
    this.blocked.delete(owner);
    if (!page || page.isClosed()) {
      page = await context.newPage();
      if (permissionVersion !== (this.permissionVersions.get(owner) || 0)) {
        await page.close();
        throw new Error(
          'Website access changed. Check this chat’s permissions before browsing again.',
        );
      }
      this.pages.set(owner, page);
      page.on('popup', (popup) => void popup.close());
      await page.route('**/*', async (route) => {
        const request = route.request();
        if (request.isNavigationRequest() && request.frame() === page!.mainFrame()) {
          let origin;
          try {
            origin = httpUrl(request.url()).origin;
          } catch {
            await route.abort();
            return;
          }
          if (!this.permissions.get(owner)?.has(origin)) {
            this.blocked.set(owner, origin);
            await route.abort();
            return;
          }
        }
        await route.continue();
      });
    }
    const results: any[] = [];
    try {
      for (const action of operations) {
        if (action.kind === 'navigate') {
          const url = httpUrl(action.url);
          if (!allowed.has(url.origin))
            throw Object.assign(new Error(`Authorize browsing ${url.origin} first.`), {
              code: 'SITE_PERMISSION',
              details: { origin: url.origin },
            });
          await page.goto(url.toString(), { waitUntil: 'domcontentloaded', timeout: 25000 });
        } else {
          if (!allowed.has(httpUrl(page.url()).origin))
            throw new Error('Authorize this site before interacting.');
          if (action.kind === 'click')
            await page.locator(String(action.selector)).first().click({ timeout: 10000 });
          else if (action.kind === 'fill')
            await page
              .locator(String(action.selector))
              .first()
              .fill(String(action.text), { timeout: 10000 });
          else if (action.kind === 'press')
            await page
              .locator(String(action.selector))
              .first()
              .press(String(action.key), { timeout: 10000 });
          else if (action.kind === 'read') {
            let selector = action.selector;
            if (!selector) {
              for (const candidate of ['main', 'article', '[role=main]', 'body'])
                if (await page.locator(candidate).count()) {
                  selector = candidate;
                  break;
                }
            }
            const text = await page
              .locator(selector || 'body')
              .first()
              .innerText({ timeout: 10000 });
            results.push({ text: text.slice(0, 18000), truncated: text.length > 18000 });
          } else if (action.kind === 'links') {
            results.push(
              await page.locator('a[href]').evaluateAll((elements) =>
                elements
                  .slice(0, 100)
                  .map((element) => ({
                    text: (element.textContent || '').trim().slice(0, 120),
                    url: (element as HTMLAnchorElement).href,
                  }))
                  .filter((link) => link.text),
              ),
            );
          } else throw new Error('Unknown browser action');
        }
      }
      return {
        url: page.url(),
        title: await page.title(),
        results,
        blockedOrigin: this.blocked.get(owner),
      };
    } catch (error: any) {
      const blockedOrigin = this.blocked.get(owner);
      if (blockedOrigin)
        throw Object.assign(
          new Error(
            `The page tried to navigate to ${blockedOrigin}. Authorize that site to continue.`,
          ),
          { code: 'SITE_PERMISSION', details: { origin: blockedOrigin } },
        );
      throw error;
    }
  }
  async xBookmarks() {
    const context = await this.start();
    const page = await context.newPage();
    const bookmarks = new Map<string, any>();
    const pending = new Set<Promise<void>>();
    const listener = (response: any) => {
      if (!response.url().includes('/graphql/') || !response.url().includes('Bookmarks')) return;
      const task = (async () => {
        try {
          const data = await response.json();
          const visit = (value: any) => {
            if (!value || typeof value !== 'object') return;
            const result = value.itemContent?.tweet_results?.result;
            const tweet = result?.tweet || result;
            if (tweet?.legacy?.full_text && tweet.rest_id && tweet.core) {
              const user = tweet.core.user_results?.result;
              const handle = user?.legacy?.screen_name || user?.core?.screen_name;
              const id = tweet.rest_id;
              const text =
                tweet.note_tweet?.note_tweet_results?.result?.text || tweet.legacy.full_text;
              bookmarks.set(id, {
                id: `x-${id}`,
                title: text.slice(0, 120),
                description: text,
                url: `https://x.com/${handle || 'i'}/status/${id}`,
                source: 'x',
                tags: [],
                sourceCreatedAt: tweet.legacy.created_at,
              });
            }
            for (const child of Object.values(value))
              if (typeof child === 'object')
                Array.isArray(child) ? child.forEach(visit) : visit(child);
          };
          visit(data);
        } catch {}
      })();
      pending.add(task);
      void task.finally(() => pending.delete(task));
    };
    page.on('response', listener);
    try {
      await page.goto('https://x.com/i/bookmarks', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await page
        .waitForSelector(
          'article[data-testid=tweet], [data-testid=emptyState], input[autocomplete=username]',
          { timeout: 20000 },
        )
        .catch(() => {});
      if (
        /login|flow/.test(page.url()) ||
        (await page.locator('input[autocomplete=username]').count())
      )
        throw new Error('Sign in to X in Settings, then refresh bookmarks again.');
      let unchanged = 0;
      for (let step = 0; step < 50 && unchanged < 4; step++) {
        const previous = bookmarks.size;
        await page.mouse.wheel(0, 1500);
        await page.waitForTimeout(600);
        await Promise.all([...pending]);
        unchanged = bookmarks.size === previous ? unchanged + 1 : 0;
      }
      if (!bookmarks.size && !(await page.locator('[data-testid=emptyState]').count()))
        throw new Error(
          'X did not return readable bookmarks. Its unofficial interface may have changed; try reconnecting.',
        );
      return {
        bookmarks: [...bookmarks.values()],
        complete: !!(await page.locator('[data-testid=emptyState]').count()),
      };
    } finally {
      page.off('response', listener);
      await page.close();
      await Promise.all([...pending]);
    }
  }
  async close() {
    await this.context?.close();
    this.context = undefined;
    this.pages.clear();
  }
  async revoke(owner: string, origin: string) {
    this.permissionVersions.set(owner, (this.permissionVersions.get(owner) || 0) + 1);
    this.permissions.get(owner)?.delete(origin);
    const page = this.pages.get(owner);
    this.pages.delete(owner);
    await page?.close();
  }
}
