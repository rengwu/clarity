import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  protocol,
  net,
  shell,
  Menu,
  Tray,
  nativeImage,
  session,
} from 'electron';
import { readFile, writeFile, mkdir, stat, realpath } from 'node:fs/promises';
import { watch, type FSWatcher } from 'node:fs';
import { join, dirname, basename, resolve, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import type { AppEvent, ApiResult, Settings } from '../shared/types';
import { modules as moduleNames, defaultSettings } from '../shared/types';
import { Store } from './store';
import { Files } from './files';
import { Auth, Secrets } from './auth';
import { Integrations, httpUrl } from './integrations';
import { Browser } from './browser';
import { Modules } from './modules';
import { Chats } from './chat';
import { Wiki } from './wiki';
import { Automations } from './automations';
import { Music } from './music';

const output = dirname(fileURLToPath(import.meta.url));
app.setName('Clarity');
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'clarity',
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  },
]);
let window: BrowserWindow | undefined;
let tray: Tray | undefined;
let root: string | undefined;
let store: Store | undefined;
let files: Files | undefined;
let auth: Auth | undefined;
let integrations: Integrations | undefined;
let browser: Browser | undefined;
let modules: Modules | undefined;
let chats: Chats | undefined;
let wiki: Wiki | undefined;
let automations: Automations | undefined;
let music: Music | undefined;
let watchers: FSWatcher[] = [];
let cleanupTimer: ReturnType<typeof setInterval> | undefined;
let quitting = false;
const bootstrap = join(app.getPath('userData'), 'root.txt');
const registeredSessions = new WeakSet<Electron.Session>();
const notify = (event: AppEvent) => {
  for (const win of BrowserWindow.getAllWindows())
    if (!win.isDestroyed() && win.webContents.getURL().startsWith('clarity://app/'))
      win.webContents.send('clarity:event', event);
};
async function initialize(folder: string) {
  if (store) throw new Error('Restart Clarity to change the data folder.');
  await mkdir(folder, { recursive: true });
  root = await realpath(folder);
  files = new Files(root);
  await files.initialize();
  await mkdir(join(root, '.clarity', 'ui', 'Shared Dictionary', 'cache'), { recursive: true });
  store = new Store(root, join(output, 'worker.mjs'));
  await store.start();
  const secrets = new Secrets(root);
  await secrets.load();
  auth = new Auth(secrets, notify);
  integrations = new Integrations(auth, store);
  browser = new Browser(root);
  modules = new Modules(store, files, integrations, browser, notify);
  chats = new Chats(modules, auth, notify);
  await chats.initialize();
  wiki = new Wiki(files);
  modules.onWikiChanged = () => wiki!.build();
  await wiki.build();
  music = new Music(integrations, auth, store, notify, join(output, 'clarity-player'), root);
  modules.music = music;
  automations = new Automations(modules, chats, auth, notify);
  await automations.start();
  await files.cleanup();
  cleanupTimer = setInterval(
    () =>
      void files!
        .cleanup()
        .then(() => notify({ type: 'changed', module: 'chats' }))
        .catch(() => {}),
    6 * 60 * 60 * 1000,
  );
  for (const area of ['Notes', 'Wiki']) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const watcher = watch(join(root, area), { recursive: true }, (_event, name) => {
      if (!name?.endsWith('.md')) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        notify({ type: 'changed', module: area.toLowerCase() });
        if (area === 'Wiki') void wiki!.build().catch(() => {});
      }, 200);
    });
    watchers.push(watcher);
  }
}
async function handleProtocol(request: Request): Promise<Response> {
  const url = new URL(request.url);
  try {
    if (url.hostname === 'app') {
      const file = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
      if (!['index.html', 'app.js', 'app.css'].includes(file))
        return new Response('Not found', { status: 404 });
      const response = await net.fetch(pathToFileURL(join(output, file)).toString());
      const headers = new Headers(response.headers);
      headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' clarity: data: https:; media-src 'self' clarity: blob:; frame-src clarity://wiki; connect-src 'self'; object-src 'none'; base-uri 'none'",
      );
      return new Response(response.body, { headers, status: response.status });
    }
    if (!root || !files || !integrations)
      return new Response('Choose a data folder', { status: 409 });
    if (url.hostname === 'wiki' && url.pathname === '/index.html')
      return net.fetch(pathToFileURL(join(root, 'Wiki', 'index.html')).toString());
    if (url.hostname === 'assets') {
      const parts = decodeURIComponent(url.pathname).slice(1).split('/');
      const area = parts.shift()!;
      const path = await files.path(area, parts.join('/'));
      if (!/\.(png|jpe?g|gif|webp)$/i.test(path))
        return new Response('Only images are exposed', { status: 403 });
      return net.fetch(pathToFileURL(path).toString());
    }
    if (url.hostname === 'stream')
      return integrations.navidrome('stream', { id: decodeURIComponent(url.pathname.slice(1)) });
    if (url.hostname === 'cover')
      return integrations.navidrome('getCoverArt', {
        id: decodeURIComponent(url.pathname.slice(1)),
        size: 320,
      });
    return new Response('Not found', { status: 404 });
  } catch (error: any) {
    return new Response(error.message, { status: 400 });
  }
}
function openWindow() {
  if (window && !window.isDestroyed()) {
    window.show();
    window.focus();
    return;
  }
  const profile = root
    ? session.fromPath(join(root, '.clarity', 'ui'))
    : session.fromPartition('clarity-onboarding');
  if (!registeredSessions.has(profile)) {
    profile.protocol.handle('clarity', handleProtocol);
    registeredSessions.add(profile);
  }
  profile.setPermissionRequestHandler((_contents, permission, callback) =>
    callback(permission === 'mediaKeySystem'),
  );
  window = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 850,
    minHeight: 600,
    title: 'Clarity',
    backgroundColor: '#faf9f6',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: join(output, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      session: profile,
    },
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) void shell.openExternal(url);
    return { action: 'deny' };
  });
  window.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('clarity://app/')) {
      event.preventDefault();
      if (/^https?:/.test(url)) void shell.openExternal(url);
    }
  });
  window.webContents.on('will-frame-navigate', (event) => {
    if (event.isMainFrame || event.url.startsWith('clarity://wiki/index.html')) return;
    event.preventDefault();
    if (/^https?:/.test(event.url)) void shell.openExternal(event.url);
    else if (files && event.url.startsWith('clarity://wiki/')) {
      const path = decodeURIComponent(new URL(event.url).pathname.slice(1));
      void files
        .path('Wiki', path)
        .then((path) => shell.showItemInFolder(path))
        .catch(() => {});
    }
  });
  window.on('closed', () => {
    window = undefined;
  });
  window.on('close', (event) => {
    if (!quitting) {
      event.preventDefault();
      window?.hide();
    }
  });
  void window.loadURL('clarity://app/');
}

async function call(method: string, args: any = {}): Promise<any> {
  if (method === 'bootstrap')
    return {
      root,
      settings: modules ? await modules.settings() : defaultSettings,
      auth: auth ? await auth.status() : {},
      models: chats ? await chats.models() : [],
    };
  if (method === 'root.pick') {
    if (root) {
      await shell.openPath(root);
      return { root };
    }
    const result = await dialog.showOpenDialog(window!, {
      title: 'Choose your Clarity folder',
      defaultPath: join(homedir(), 'Clarity'),
      properties: ['openDirectory', 'createDirectory'],
    });
    if (result.canceled) return null;
    await initialize(result.filePaths[0]);
    await mkdir(dirname(bootstrap), { recursive: true });
    await writeFile(bootstrap, root!);
    window?.destroy();
    window = undefined;
    openWindow();
    return { root };
  }
  if (method === 'external.open') {
    await shell.openExternal(httpUrl(args.url).toString());
    return {};
  }
  if (!modules || !store || !files || !chats || !auth || !music)
    throw new Error('Choose your Clarity folder first.');
  if (method === 'settings.save') {
    const previous = await modules.settings();
    const changes: any = {};
    for (const key of ['model', 'effort', 'lastChat', 'currency', 'theme'])
      if (args[key] !== undefined) changes[key] = args[key];
    if (Array.isArray(args.enabled))
      changes.enabled = [
        ...new Set(['chat', ...args.enabled.filter((name: any) => moduleNames.includes(name))]),
      ];
    if (previous.enabled.includes('music') && changes.enabled && !changes.enabled.includes('music'))
      await music.close();
    return modules.saveSettings(changes);
  }
  if (method === 'module') return modules.invoke(args.module, args.method, args.args || {});
  if (method === 'chats.list')
    return (await store.list('chats'))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map(({ messages, ...chat }) => chat);
  if (method === 'chats.get') return store.get('chats', args.id);
  if (method === 'chats.create') return chats.create();
  if (method === 'chats.send') return chats.send(args.id, args);
  if (method === 'chats.stop') return chats.stop(args.id);
  if (method === 'actions.list')
    return (await store.list('actions'))
      .filter((action) => action.owner === args.owner)
      .sort((a, b) => a.createdAt - b.createdAt);
  if (method === 'actions.review') return modules.approve(args.id, args.apply);
  if (method === 'auth.status') return auth.status();
  if (method === 'auth.existingCodex') return auth.useExistingCodex();
  if (method === 'auth.codex') return auth.connectCodex();
  if (method === 'auth.answer') return auth.answer(args.id, args.value);
  if (method === 'auth.cancel') return auth.cancel();
  if (method === 'auth.oauth') {
    if (!['google', 'spotify'].includes(args.provider)) throw new Error('Unknown provider');
    return auth.connectOAuth(args.provider, args.clientId, args.clientSecret);
  }
  if (method === 'auth.configure') return integrations!.configure(args.provider, args);
  if (method === 'auth.disconnect') {
    if (
      !['codex', 'google', 'spotify', 'spotify-playback', 'navidrome', 'linkding'].includes(
        args.provider,
      )
    )
      throw new Error('Unknown provider');
    if (['spotify', 'spotify-playback', 'navidrome'].includes(args.provider)) await music.close();
    await auth.secrets.set(args.provider, undefined);
    if (args.provider === 'spotify') await auth.secrets.set('spotify-playback', undefined);
    if (args.provider === 'codex') await auth.secrets.set('codex-existing', undefined);
    return auth.status();
  }
  if (method === 'browser.login') return browser!.login(args.url);
  if (method === 'attachments.pick') {
    const result = await dialog.showOpenDialog(window!, {
      properties: ['openFile', 'multiSelections'],
    });
    const attachments = [],
      errors = [];
    for (const path of result.filePaths) {
      try {
        if ((await stat(path)).size >= 30_000_000)
          throw new Error(`${basename(path)} was skipped: files must be below 30 MB.`);
        attachments.push(await files.attach(basename(path), await readFile(path)));
      } catch (error: any) {
        errors.push(error.message);
      }
    }
    return { attachments, errors };
  }
  if (method === 'attachments.add')
    return files.attach(args.name, Buffer.from(args.bytes), args.mime);
  if (method === 'notes.image')
    return files.asset('Notes', args.path, args.name, Buffer.from(args.bytes));
  if (method === 'wiki.open') {
    await shell.openPath(join(root!, 'Wiki', 'index.html'));
    return {};
  }
  if (method === 'music.connectPlayback') return music.connectPlayback();
  if (method === 'automations.run') return automations!.run(args.id);
  throw new Error('Unknown application method');
}

if (!process.env.CLARITY_TEST_ROOT && !app.requestSingleInstanceLock()) app.quit();
else {
  ipcMain.handle('clarity:call', async (event, method, args): Promise<ApiResult> => {
    if (event.senderFrame?.url !== 'clarity://app/') return { ok: false, error: 'Untrusted frame' };
    try {
      return { ok: true, value: await call(method, args) };
    } catch (error: any) {
      return {
        ok: false,
        error: error.message || 'Operation failed',
        code: error.code,
        details: error.details,
      };
    }
  });
  app.on('second-instance', openWindow);
  app.on('activate', openWindow);
  app.on('window-all-closed', () => {});
  app.on('before-quit', (event) => {
    if (quitting) return;
    event.preventDefault();
    quitting = true;
    void (async () => {
      if (window && !window.isDestroyed()) {
        try {
          await window.webContents.executeJavaScript('window.prepareClarityQuit?.()');
        } catch {
          quitting = false;
          window.show();
          dialog.showErrorBox(
            'A note needs attention',
            'Save the unsaved note as a copy before quitting.',
          );
          return;
        }
      }
      auth?.cancel();
      clearInterval(cleanupTimer);
      await automations?.stop();
      watchers.forEach((watcher) => watcher.close());
      await music?.close();
      await chats?.close();
      await browser?.close();
      await store?.close();
      tray?.destroy();
      app.quit();
    })().catch(() => app.exit(1));
  });
  app
    .whenReady()
    .then(async () => {
      let folder = process.env.CLARITY_TEST_ROOT;
      if (!folder) {
        try {
          folder = (await readFile(bootstrap, 'utf8')).trim();
        } catch {}
      }
      if (folder) await initialize(folder);
      const icon = nativeImage.createFromDataURL(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAALUlEQVQ4T2NkYGD4z0ABYBw1gGE0DBhGw0BgNAyGgYEyDAZGw4BhNAwYRkNAADhCEBHxrOEwAAAAAElFTkSuQmCC',
      );
      icon.setTemplateImage(true);
      tray = new Tray(icon);
      tray.setToolTip('Clarity');
      tray.setContextMenu(
        Menu.buildFromTemplate([
          { label: 'Open Clarity', click: openWindow },
          { type: 'separator' },
          { label: 'Quit Clarity', click: () => app.quit() },
        ]),
      );
      Menu.setApplicationMenu(
        Menu.buildFromTemplate([
          {
            label: 'Clarity',
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { label: 'Open Clarity', click: openWindow },
              { role: 'hide' },
              { role: 'quit' },
            ],
          },
          {
            label: 'Edit',
            submenu: [
              { role: 'undo' },
              { role: 'redo' },
              { type: 'separator' },
              { role: 'cut' },
              { role: 'copy' },
              { role: 'paste' },
              { role: 'selectAll' },
            ],
          },
          {
            label: 'View',
            submenu: [{ role: 'reload' }, { role: 'toggleDevTools' }, { role: 'togglefullscreen' }],
          },
        ]),
      );
      openWindow();
    })
    .catch((error) => {
      console.error('Clarity startup failed:', error);
      dialog.showErrorBox('Clarity could not start', error.message);
      app.exit(1);
    });
}
