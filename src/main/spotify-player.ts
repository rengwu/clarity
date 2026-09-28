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
        (await promisify(execFile)(this.executable, ['--info'], { timeout: 5000 })).stdout,
      );
    } catch {
      throw new Error(
        'Spotify playback helper is missing. Run node tooling/clarity.mjs player, or use the packaged app.',
      );
    }
    return this.auth.connectOAuth('spotify-playback', info.clientId);
  }
  private async start() {
    if (this.connecting) return this.connecting;
    if (this.child && this.child.exitCode === null && !this.child.killed) return;
    const generation = this.generation;
    this.connecting = (async () => {
      const token = await this.auth.token('spotify-playback');
      const temporaryDirectory = join(this.root, '.clarity', 'spotify-audio');
      await mkdir(temporaryDirectory, { recursive: true });
      if (generation !== this.generation) throw new Error('Spotify playback was stopped.');
      const child = spawn(this.executable, [], { stdio: 'pipe' });
      this.child = child;
      await new Promise<void>((resolve, reject) => {
        let ready = false;
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
          if (value.event === 'ready') {
            ready = true;
            clearTimeout(timer);
            resolve();
          } else if (value.event === 'error' && !ready) {
            clearTimeout(timer);
            reject(new Error(value.message));
            child.kill();
          } else this.event(value);
        });
        child.on('error', (error) => {
          clearTimeout(timer);
          reject(error);
        });
        child.on('exit', () => {
          clearTimeout(timer);
          input.close();
          if (this.child === child) this.child = undefined;
          if (!ready) reject(new Error('Spotify audio helper stopped before connecting.'));
          else this.event({ event: 'state', playing: false });
        });
        child.stderr.resume();
        child.stdin.on('error', () => {});
        child.stdin.write(JSON.stringify({ token, temporaryDirectory }) + '\n');
      });
    })().finally(() => {
      this.connecting = undefined;
    });
    return this.connecting;
  }
  async command(command: string, values: any = {}) {
    if (command === 'load' || command === 'resume') await this.start();
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
