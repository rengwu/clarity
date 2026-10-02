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
import { parseItemLink, type ItemTarget } from '../shared/navigation';
import type { AppEvent, ApiResult, Settings, Chat } from '../shared/types';
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
import { approximateLocation, requestLocationOnStartup } from './environment';
import { searchLocal } from './launcher';

const output = dirname(fileURLToPath(import.meta.url));
app.setName('Clarity');
if (process.platform === 'darwin')
  app.commandLine.appendSwitch(
    'enable-features',
    'LocationProviderManager:LocationProviderManagerMode/PlatformOnly',
  );
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'clarity',
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  },
]);
let window: BrowserWindow | undefined;
let pendingNavigation: ItemTarget | undefined;
function openItem(address: string) {
  const target = parseItemLink(address);
  if (!target) return;
  pendingNavigation = target;
  if (app.isReady()) {
    openWindow();
    notify({ type: 'navigate' });
  }
}
app.on('open-url', (event, address) => {
  event.preventDefault();
  openItem(address);
});
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
let locating = false;
let locationStartupChecked = false;
const bootstrap = join(app.getPath('userData'), 'root.txt');
const registeredSessions = new WeakSet<Electron.Session>();
const notify = (event: AppEvent) => {
  if (
    event.type === 'auth' &&
    ['spotify', 'navidrome'].includes(event.data?.provider) &&
    ['connected', 'disconnected'].includes(event.data?.kind)
  )
    music?.clearCollections();
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
  integrations = new Integrations(auth, store, () =>
    notify({ type: 'changed', module: 'bookmarks' }),
  );
  browser = new Browser(root);
  modules = new Modules(store, files, integrations, browser, notify);
  chats = new Chats(modules, auth, notify);
  await chats.initialize();
  wiki = new Wiki(files);
  modules.onWikiChanged = () => wiki!.build();
  await wiki.build();
  music = new Music(integrations, auth, store, notify, join(output, 'clarity-player'), root);
  music.setNormalization((await modules.settings()).musicNormalization);
  modules.music = music;
  automations = new Automations(modules, chats, auth, notify);
  await automations.start();
  await integrations.start();
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
    if (url.hostname === 'attachment') {
      const { path } = await files.attachment(decodeURIComponent(url.pathname.slice(1)));
      if (!/\.(png|jpe?g|gif|webp)$/i.test(path))
        return new Response('Only images are exposed', { status: 403 });
      return net.fetch(pathToFileURL(path).toString());
    }
    if (url.hostname === 'assets') {
      const parts = decodeURIComponent(url.pathname).slice(1).split('/');
      const area = parts.shift()!;
      const path = await files.path(area, parts.join('/'));
      if (!/\.(png|jpe?g|gif|webp)$/i.test(path))
        return new Response('Only images are exposed', { status: 403 });
      return net.fetch(pathToFileURL(path).toString());
    }
    if (url.hostname === 'stream')
      return integrations.navidrome(
        'stream',
        { id: decodeURIComponent(url.pathname.slice(1)) },
        undefined,
        request.headers.get('range') || undefined,
      );
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
  const locationRequest = (
    contents: Electron.WebContents | null,
    details: { isMainFrame: boolean; requestingUrl?: string },
  ) =>
    locating &&
    contents === window?.webContents &&
    details.isMainFrame &&
    details.requestingUrl === 'clarity://app/';
  profile.setPermissionRequestHandler((contents, permission, callback, details) =>
    callback(
      permission === 'mediaKeySystem' ||
        (['geolocation', 'geolocation-approximate'].includes(permission) &&
          locationRequest(contents, details)),
    ),
  );
  profile.setPermissionCheckHandler(
    (contents, permission, _origin, details) =>
      !['geolocation', 'geolocation-approximate'].includes(permission) ||
      locationRequest(contents, details),
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
  window.webContents.once('did-finish-load', () => {
    if (
      locationStartupChecked ||
      !modules ||
      process.env.CLARITY_TEST_ROOT ||
      process.platform !== 'darwin'
    )
      return;
    locationStartupChecked = true;
    void modules
      .settings()
      .then(async (settings) => {
        if (requestLocationOnStartup(settings)) await call('location.request');
      })
      .catch(() => {});
  });
  void window.loadURL('clarity://app/');
}

async function call(method: string, args: any = {}): Promise<any> {
  if (method === 'navigation.take') {
    const target = pendingNavigation;
    pendingNavigation = undefined;
    return target;
  }
  if (method === 'bootstrap')
    return {
      root,
      settings: modules ? await modules.settings() : defaultSettings,
      auth: auth ? await auth.status() : {},
      models: chats ? await chats.models() : [],
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      deviceLocationAvailable: process.platform === 'darwin',
      locating,
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
  if (method === 'permissions.openLocationSettings') {
    await shell.openExternal(
      'x-apple.systempreferences:com.apple.preference.security?Privacy_LocationServices',
    );
    return {};
  }
  if (method === 'permissions.sites')
    return (await store.list<Chat>('chats'))
      .filter((chat) => chat.grants?.length)
      .map(({ id, title, grants }) => ({ id, title, origins: grants }));
  if (method === 'permissions.revokeSite') {
    const chat = await store.get<Chat>('chats', args.chatId);
    if (!chat) throw new Error('Chat not found.');
    const origin = httpUrl(args.origin).origin;
    await store.put(
      'chats',
      chat.id,
      { ...chat, grants: chat.grants.filter((value) => value !== origin) },
      chat.revision,
    );
    await browser!.revoke(chat.id, origin);
    notify({ type: 'changed', module: 'actions' });
    return {};
  }
  if (method === 'location.request') {
    if (process.platform !== 'darwin')
      throw new Error('Device location currently requires macOS. Enter a location instead.');
    if (locating) throw new Error('A location request is already running.');
    if (!window?.isVisible()) throw new Error('Open Clarity to request device location.');
    locating = true;
    try {
      await modules.saveSettings({
        useDeviceLocation: true,
        locationRequested: true,
        locationError: undefined,
      });
      const position = await window.webContents.executeJavaScript(
        `new Promise((resolve) => {
        const timeout = setTimeout(() => resolve({ errorCode: 3 }), 45000);
        navigator.geolocation.getCurrentPosition(
          position => {
            clearTimeout(timeout);
            resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude,
              accuracy: position.coords.accuracy, timestamp: position.timestamp });
          },
          error => {
            clearTimeout(timeout);
            resolve({ errorCode: error.code });
          },
          { enableHighAccuracy: false, maximumAge: 60000, timeout: 30000 }
        );
      })`,
        true,
      );
      if (!(await modules.settings()).useDeviceLocation) return {};
      if (position.errorCode) {
        if (position.errorCode === 1)
          await modules.saveSettings({
            locationPermission: 'denied',
            deviceLocation: undefined,
          });
        throw new Error(
          position.errorCode === 1
            ? 'Location access denied. Allow Clarity in System Settings → Privacy & Security → Location Services, or enter a location.'
            : 'Device location is unavailable. Check Location Services and Wi-Fi, then try again.',
        );
      }
      const deviceLocation = approximateLocation(position);
      return await modules.saveSettings({
        location: '',
        deviceLocation,
        locationPermission: 'granted',
        locationError: undefined,
      });
    } catch (error: any) {
      await modules.saveSettings({ locationError: error.message });
      throw error;
    } finally {
      locating = false;
      notify({ type: 'changed', module: 'settings' });
    }
  }
  if (method === 'settings.save') {
    const previous = await modules.settings();
    const changes: any = {};
    if (args.location !== undefined) {
      if (typeof args.location !== 'string' || args.location.trim().length > 200)
        throw new Error('Location must be text of at most 200 characters.');
      changes.location = args.location.trim();
      changes.deviceLocation = undefined;
      changes.useDeviceLocation = false;
      changes.locationError = undefined;
    }
    if (args.useDeviceLocation === false) {
      changes.useDeviceLocation = false;
      changes.deviceLocation = undefined;
      changes.locationError = undefined;
    }
    for (const key of ['model', 'effort', 'lastChat', 'currency', 'theme'])
      if (args[key] !== undefined) changes[key] = args[key];
    if (Array.isArray(args.enabled))
      changes.enabled = [
        ...new Set(['chat', ...args.enabled.filter((name: any) => moduleNames.includes(name))]),
      ];
    if (args.linkdingRefreshMinutes !== undefined) {
      if (![0, 60, 1440].includes(args.linkdingRefreshMinutes))
        throw new Error('Choose manual, hourly, or daily refresh.');
      changes.linkdingRefreshMinutes = args.linkdingRefreshMinutes;
    }
    if (args.autoApproveActions !== undefined) changes.autoApproveActions = args.autoApproveActions;
    for (const key of ['autoInterpretCommands', 'reducedMotion', 'musicNormalization']) {
      if (args[key] !== undefined) {
        if (typeof args[key] !== 'boolean')
          throw new Error('Choose an enabled or disabled setting.');
        changes[key] = args[key];
      }
    }
    if (previous.enabled.includes('music') && changes.enabled && !changes.enabled.includes('music'))
      await music.close();
    const saved = await modules.saveSettings(changes);
    music.setNormalization(saved.musicNormalization);
    await integrations!.checkRefresh();
    return saved;
  }
  if (method === 'module') return modules.invoke(args.module, args.method, args.args || {});
  if (method === 'launcher.search') return searchLocal(modules, args.query);
  if (method === 'launcher.interpret') return chats.interpretCommand(args.query);
  if (method === 'launcher.cancel') return chats.cancelInterpretation();
  if (method === 'chats.list')
    return (await store.list('chats'))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map(({ messages, ...chat }) => chat);
  if (method === 'chats.get') {
    const chat = await store.get('chats', args.id);
    if (!chat) throw new Error('This conversation is no longer available.');
    return chat;
  }
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
  if (method === 'auth.configure') {
    const result = await integrations!.configure(args.provider, args);
    if (args.provider === 'navidrome')
      notify({ type: 'auth', data: { kind: 'connected', provider: args.provider } });
    await integrations!.checkRefresh();
    return result;
  }
  if (method === 'linkding.status') return integrations!.linkdingStatus();
  if (method === 'auth.disconnect') {
    if (
      !['codex', 'google', 'spotify', 'spotify-playback', 'navidrome', 'linkding'].includes(
        args.provider,
      )
    )
      throw new Error('Unknown provider');
    if (['spotify', 'spotify-playback', 'navidrome'].includes(args.provider)) await music.close();
    await auth.secrets.set(args.provider, undefined);
    if (args.provider === 'codex') await auth.secrets.set('codex-existing', undefined);
    await integrations!.checkRefresh();
    notify({ type: 'auth', data: { kind: 'disconnected', provider: args.provider } });
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
  if (method === 'attachments.preview') return files.previewAttachment(args.id);
  if (method === 'attachments.reveal') {
    shell.showItemInFolder((await files.attachment(args.id)).path);
    return {};
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
  app.on('second-instance', (_event, args) => {
    openWindow();
    args.filter((value) => value.startsWith('clarity://item/')).forEach(openItem);
  });
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
      await integrations?.stop();
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
      if (app.isPackaged && !process.env.CLARITY_TEST_ROOT)
        app.setAsDefaultProtocolClient('clarity');
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
