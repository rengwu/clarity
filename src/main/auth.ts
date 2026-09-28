import { safeStorage, shell } from 'electron';
import { readFile, writeFile, mkdir, rename, copyFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { randomUUID, createHash, randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { openaiCodexProvider } from '@earendil-works/pi-ai/providers/openai-codex';
import type { AppEvent } from '../shared/types';
const openaiCodexOAuth = openaiCodexProvider().auth!.oauth!;

export class Secrets {
  private values: Record<string, any> = {};
  private pending = Promise.resolve();
  warning?: string;
  constructor(private root: string) {}
  async load() {
    try {
      const encrypted = await readFile(join(this.root, '.clarity', 'credentials.bin'));
      if (!safeStorage.isEncryptionAvailable()) {
        this.warning =
          'Credential storage is locked or unavailable. Unlock it and restart Clarity to reconnect.';
        return;
      }
      try {
        const values = JSON.parse(safeStorage.decryptString(encrypted));
        if (!values || typeof values !== 'object' || Array.isArray(values))
          throw new Error('Invalid credentials');
        this.values = values;
      } catch {
        this.warning =
          'Saved connections cannot be decrypted on this machine. Your local data is available; reconnect accounts in Settings. The old credentials will be preserved.';
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  get<T = any>(key: string): T | undefined {
    return this.values[key];
  }
  set(key: string, value: any) {
    const task = this.pending.catch(() => {}).then(() => this.write(key, value));
    this.pending = task;
    return task;
  }
  private async write(key: string, value: any) {
    if (!safeStorage.isEncryptionAvailable())
      throw new Error('OS credential encryption is unavailable. Credentials were not saved.');
    const next = { ...this.values };
    if (value === undefined) delete next[key];
    else next[key] = value;
    const file = join(this.root, '.clarity', 'credentials.bin');
    const temporary = `${file}.${randomUUID()}.tmp`;
    await writeFile(temporary, safeStorage.encryptString(JSON.stringify(next)), { mode: 0o600 });
    if (this.warning)
      await copyFile(file, join(this.root, '.clarity', `credentials-recovery-${randomUUID()}.bin`));
    await rename(temporary, file);
    this.values = next;
    this.warning = undefined;
  }
}

export class Auth {
  private controller?: AbortController;
  private prompts = new Map<
    string,
    { resolve: (value: string) => void; reject: (error: Error) => void }
  >();
  private refreshing = new Map<string, Promise<any>>();
  constructor(
    readonly secrets: Secrets,
    private notify: (event: AppEvent) => void,
  ) {}
  async status() {
    let installedCodex = false;
    try {
      const auth = JSON.parse(await readFile(this.codexFile(), 'utf8'));
      installedCodex = !!auth.tokens?.access_token;
    } catch {}
    return {
      credentialWarning: this.secrets.warning,
      codex: !!this.secrets.get('codex') || !!this.secrets.get('codex-existing'),
      installedCodex,
      google: !!this.secrets.get('google')?.access_token,
      spotify: !!this.secrets.get('spotify')?.access_token,
      spotifyPlayback: !!this.secrets.get('spotify-playback')?.access_token,
      navidrome: !!this.secrets.get('navidrome'),
      linkding: !!this.secrets.get('linkding'),
      googleClientId: this.secrets.get('google-config')?.clientId || '',
      spotifyClientId: this.secrets.get('spotify-config')?.clientId || '',
      navidromeUrl: this.secrets.get('navidrome')?.url || '',
      navidromeUsername: this.secrets.get('navidrome')?.username || '',
      linkdingUrl: this.secrets.get('linkding')?.url || '',
    };
  }
  private codexFile() {
    return join(process.env.CODEX_HOME || join(homedir(), '.codex'), 'auth.json');
  }
  async useExistingCodex() {
    const auth = JSON.parse(await readFile(this.codexFile(), 'utf8'));
    if (!auth.tokens?.access_token) throw new Error('No ChatGPT sign-in was found in Codex.');
    await this.secrets.set('codex-existing', true);
    await this.secrets.set('codex', undefined);
    return this.status();
  }
  async codexToken() {
    if (this.secrets.get('codex-existing')) {
      const auth = JSON.parse(await readFile(this.codexFile(), 'utf8'));
      if (!auth.tokens?.access_token)
        throw new Error('Sign in to Codex again, or connect Codex directly in Settings.');
      return auth.tokens.access_token as string;
    }
    let credential = this.secrets.get('codex');
    if (!credential) throw new Error('Connect Codex in Settings.');
    if (credential.expires < Date.now() + 60000)
      credential = await this.refresh('codex', async () => {
        const updated = await openaiCodexOAuth.refresh!(credential, new AbortController().signal);
        await this.secrets.set('codex', updated);
        return updated;
      });
    return credential.access as string;
  }
  private refresh(key: string, fn: () => Promise<any>) {
    const existing = this.refreshing.get(key);
    if (existing) return existing;
    const task = fn().finally(() => this.refreshing.delete(key));
    this.refreshing.set(key, task);
    return task;
  }
  answer(id: string, value: string) {
    const pending = this.prompts.get(id);
    if (!pending) throw new Error('This sign-in prompt expired.');
    this.prompts.delete(id);
    pending.resolve(value);
  }
  cancel() {
    this.controller?.abort();
    for (const prompt of this.prompts.values()) prompt.reject(new Error('Sign-in cancelled'));
    this.prompts.clear();
  }
  async connectCodex() {
    this.cancel();
    this.controller = new AbortController();
    const credential = await openaiCodexOAuth.login({
      signal: this.controller.signal,
      prompt: async (prompt) => {
        if (prompt.type === 'select') return 'browser';
        const id = randomUUID();
        this.notify({ type: 'auth', data: { kind: 'prompt', id, message: prompt.message } });
        return new Promise<string>((resolve, reject) => {
          this.prompts.set(id, { resolve, reject });
          prompt.signal?.addEventListener(
            'abort',
            () => {
              this.prompts.delete(id);
              reject(new Error('Prompt completed'));
            },
            { once: true },
          );
        });
      },
      notify: (event) => {
        if (event.type === 'auth_url') void shell.openExternal(event.url);
        this.notify({ type: 'auth', data: event });
      },
    });
    await this.secrets.set('codex', credential);
    await this.secrets.set('codex-existing', undefined);
    this.notify({ type: 'auth', data: { kind: 'connected', provider: 'codex' } });
    return this.status();
  }
  async connectOAuth(
    provider: 'google' | 'spotify' | 'spotify-playback',
    clientId: string,
    clientSecret = '',
  ) {
    if (!clientId.trim()) throw new Error('Enter the OAuth client ID.');
    const state = randomBytes(24).toString('hex');
    const verifier = randomBytes(48).toString('base64url');
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    const port = provider === 'spotify-playback' ? 8898 : provider === 'spotify' ? 43827 : 43828;
    const path = provider === 'spotify-playback' ? '/login' : '/callback';
    const redirect = `http://127.0.0.1:${port}${path}`;
    this.cancel();
    const controller = new AbortController();
    this.controller = controller;
    const code = await new Promise<string>((resolve, reject) => {
      const server = createServer((request, response) => {
        const url = new URL(request.url || '/', redirect);
        if (url.pathname !== path) {
          response.writeHead(404).end();
          return;
        }
        if (url.searchParams.get('state') !== state) {
          response.writeHead(400).end('Invalid sign-in state.');
          return;
        }
        const code = url.searchParams.get('code');
        response.setHeader('Content-Type', 'text/plain');
        response.end(
          code ? 'Connected. Return to Clarity.' : 'Sign-in was cancelled. Return to Clarity.',
        );
        clearTimeout(timer);
        server.close();
        if (code) resolve(code);
        else reject(new Error('Sign-in was cancelled.'));
      });
      const timer = setTimeout(() => {
        server.close();
        reject(new Error('Sign-in timed out. Try again.'));
      }, 180000);
      controller.signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          server.close();
          reject(new Error('Sign-in cancelled.'));
        },
        { once: true },
      );
      server.once('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
      server.listen(port, '127.0.0.1', () => {
        const url = new URL(
          provider === 'google'
            ? 'https://accounts.google.com/o/oauth2/v2/auth'
            : 'https://accounts.spotify.com/authorize',
        );
        const scope =
          provider === 'google'
            ? 'https://www.googleapis.com/auth/gmail.readonly'
            : provider === 'spotify-playback'
              ? 'streaming'
              : 'user-library-read user-read-private user-read-email playlist-read-private playlist-read-collaborative';
        url.search = new URLSearchParams({
          response_type: 'code',
          client_id: clientId.trim(),
          redirect_uri: redirect,
          scope,
          state,
          code_challenge_method: 'S256',
          code_challenge: challenge,
          ...(provider === 'google' ? { access_type: 'offline', prompt: 'consent' } : {}),
        }).toString();
        void shell.openExternal(url.toString()).catch((error) => {
          clearTimeout(timer);
          server.close();
          reject(error);
        });
      });
    });
    const endpoint =
      provider === 'google'
        ? 'https://oauth2.googleapis.com/token'
        : 'https://accounts.spotify.com/api/token';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId.trim(),
        code,
        redirect_uri: redirect,
        code_verifier: verifier,
        ...(clientSecret ? { client_secret: clientSecret } : {}),
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok)
      throw new Error(
        `Sign-in failed (${response.status}). Check the client ID and registered redirect URL.`,
      );
    const tokens = (await response.json()) as any;
    await this.secrets.set(`${provider}-config`, { clientId: clientId.trim(), clientSecret });
    await this.secrets.set(provider, { ...tokens, expires: Date.now() + tokens.expires_in * 1000 });
    return this.status();
  }
  async token(provider: 'google' | 'spotify' | 'spotify-playback') {
    let credential = this.secrets.get(provider);
    if (!credential)
      throw new Error(
        `Connect ${provider === 'google' ? 'Google' : provider === 'spotify-playback' ? 'Spotify playback' : 'Spotify'} in Settings.`,
      );
    if (credential.expires < Date.now() + 60000)
      credential = await this.refresh(provider, async () => {
        const config = this.secrets.get(`${provider}-config`);
        const endpoint =
          provider === 'google'
            ? 'https://oauth2.googleapis.com/token'
            : 'https://accounts.spotify.com/api/token';
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: credential.refresh_token,
            client_id: config.clientId,
            ...(config.clientSecret ? { client_secret: config.clientSecret } : {}),
          }),
          signal: AbortSignal.timeout(30000),
        });
        if (!response.ok)
          throw new Error(`Reconnect ${provider} in Settings (${response.status}).`);
        const next = (await response.json()) as any;
        const updated = { ...credential, ...next, expires: Date.now() + next.expires_in * 1000 };
        await this.secrets.set(provider, updated);
        return updated;
      });
    return credential.access_token as string;
  }
}
