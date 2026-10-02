import { spawn, execFile, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createInterface } from 'node:readline';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { Auth } from './auth';

export class SpotifyPlayer {
  private child?: ChildProcessWithoutNullStreams;
  private connecting?: Promise<void>;
  private generation = 0;
  private normalization = true;
  private renewal?: ReturnType<typeof setTimeout>;
  constructor(
    private executable: string,
    private root: string,
    private auth: Auth,
    private event: (value: any) => void,
  ) {}
  async signIn() {
    let info;
    try {
      info = JSON.parse(
        (
          await promisify(execFile)(this.executable, ['--info'], {
            timeout: 5000,
          })
        ).stdout,
      );
    } catch {
      throw new Error(
        'Spotify playback helper is missing. Run node tooling/clarity.mjs player, or use the packaged app.',
      );
    }
    return this.auth.connectOAuth('spotify-playback', info.clientId);
  }
  private async start(normalization = this.normalization) {
    if (normalization !== this.normalization) {
      await this.close();
      this.normalization = normalization;
    }
    if (this.connecting) return this.connecting;
    if (this.child && this.child.exitCode === null && !this.child.killed) return;
    const generation = this.generation;
    this.connecting = (async () => {
      const credential = await this.credential();
      const temporaryDirectory = join(this.root, '.clarity', 'spotify-audio');
      await mkdir(temporaryDirectory, { recursive: true });
      try {
        await this.connect(credential, temporaryDirectory, generation);
      } catch (error: any) {
        if (error.code !== 'authentication' || generation !== this.generation) throw error;
        const renewed = await this.credential(credential.token);
        try {
          await this.connect(renewed, temporaryDirectory, generation);
        } catch (retry: any) {
          if (retry.code === 'authentication')
            throw new Error(
              'Spotify rejected the renewed playback sign-in. Check Premium access or reconnect Spotify playback in Settings.',
            );
          throw retry;
        }
      }
    })().finally(() => {
      this.connecting = undefined;
    });
    return this.connecting;
  }
  private async credential(rejectedToken?: string) {
    const token = await this.auth.token('spotify-playback', rejectedToken);
    const expires = this.auth.secrets.get('spotify-playback')?.expires;
    if (!Number.isFinite(expires) || expires <= Date.now() + 10000)
      throw new Error('Spotify playback did not supply a valid token expiry. Try again.');
    return { token, expires: expires as number };
  }
  private scheduleRenewal(
    child: ChildProcessWithoutNullStreams,
    generation: number,
    expires: number,
  ) {
    clearTimeout(this.renewal);
    this.renewal = setTimeout(
      () => {
        void this.renew(child, generation);
      },
      Math.max(1000, Math.min(2_147_483_647, expires - Date.now() - 60000)),
    );
    this.renewal.unref();
  }
  private async renew(child: ChildProcessWithoutNullStreams, generation: number) {
    const current = () => generation === this.generation && this.child === child && !child.killed;
    if (!current()) return;
    try {
      const credential = await this.credential();
      if (!current()) return;
      await new Promise<void>((resolve, reject) =>
        child.stdin.write(JSON.stringify({ command: 'token', ...credential }) + '\n', (error) =>
          error ? reject(error) : resolve(),
        ),
      );
      if (current()) this.scheduleRenewal(child, generation, credential.expires);
    } catch (error: any) {
      if (current()) this.event({ event: 'error', message: error.message, recoverable: true });
    }
  }
  private async connect(
    credential: { token: string; expires: number },
    temporaryDirectory: string,
    generation: number,
  ) {
    if (generation !== this.generation) throw new Error('Spotify playback was stopped.');
    const child = spawn(this.executable, [], { stdio: 'pipe' });
    this.child = child;
    await new Promise<void>((resolve, reject) => {
      let ready = false;
      let failed = false;
      const timer = setTimeout(() => {
        child.kill();
        reject(new Error('Spotify playback connection timed out. Try again.'));
      }, 50000);
      const input = createInterface({ input: child.stdout });
      input.on('line', (line) => {
        let value;
        try {
          value = JSON.parse(line);
        } catch {
          return;
        }
        if (generation !== this.generation || this.child !== child) return;
        if (value.event === 'error') {
          failed = true;
          clearTimeout(this.renewal);
        }
        if (value.event === 'ready') {
          ready = true;
          clearTimeout(timer);
          this.scheduleRenewal(child, generation, credential.expires);
          resolve();
        } else if (value.event === 'error' && !ready) {
          clearTimeout(timer);
          reject(Object.assign(new Error(value.message), { code: value.code }));
          child.kill();
        } else this.event(value);
      });
      child.on('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
      child.on('exit', (code, signal) => {
        clearTimeout(timer);
        input.close();
        if (this.child === child) {
          clearTimeout(this.renewal);
          this.child = undefined;
        }
        const message = `Spotify audio player stopped unexpectedly (${signal || `exit ${code}`}). Try playing the track again.`;
        if (!ready) reject(new Error(message));
        else if (generation === this.generation && !failed)
          this.event({ event: 'error', message, recoverable: true });
      });
      child.stderr.resume();
      child.stdin.on('error', () => {});
      child.stdin.write(
        JSON.stringify({ ...credential, temporaryDirectory, normalization: this.normalization }) +
          '\n',
      );
    });
  }
  async command(command: string, values: any = {}, current = () => true) {
    if (command === 'load') await this.start(values.normalization !== false);
    else if (command === 'resume') await this.start();
    if (!current()) return;
    const child = this.child;
    if (!child || child.exitCode !== null || child.killed) {
      if (command === 'stop' || command === 'pause') return;
      throw new Error('Spotify playback is not connected.');
    }
    await new Promise<void>((resolve, reject) =>
      child.stdin.write(JSON.stringify({ command, ...values }) + '\n', (error) =>
        error ? reject(error) : resolve(),
      ),
    );
  }
  async close() {
    this.generation++;
    clearTimeout(this.renewal);
    const child = this.child;
    if (!child) return;
    child.stdin.end(JSON.stringify({ command: 'quit' }) + '\n');
    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        child.kill('SIGKILL');
        resolve();
      }, 2000);
      child.once('exit', () => {
        clearTimeout(timer);
        resolve();
      });
    });
    this.child = undefined;
  }
}
