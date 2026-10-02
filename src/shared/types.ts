export const modules = [
  'chat',
  'notes',
  'todos',
  'wiki',
  'calendar',
  'expenses',
  'mail',
  'news',
  'bookmarks',
  'music',
  'board',
  'automations',
] as const;
export type Module = (typeof modules)[number];
export type RecordValue = {
  id: string;
  createdAt: number;
  updatedAt: number;
  revision: number;
  [key: string]: any;
};
export type Settings = {
  enabled: Module[];
  autoApproveActions: string[];
  model: string;
  effort: string;
  lastChat?: string;
  currency: string;
  location: string;
  deviceLocation?: DeviceLocation;
  useDeviceLocation: boolean;
  locationRequested: boolean;
  locationPermission: 'unknown' | 'granted' | 'denied';
  locationError?: string;
  theme: 'system' | 'light' | 'dark';
  linkdingRefreshMinutes: number;
  autoInterpretCommands: boolean;
  reducedMotion: boolean;
  musicNormalization: boolean;
};
export type DeviceLocation = {
  latitude: number;
  longitude: number;
  accuracyMetres: number;
  measuredAt: number;
};
export const defaultSettings: Settings = {
  enabled: ['chat', 'notes', 'todos', 'wiki'],
  autoApproveActions: [],
  model: 'gpt-5.5',
  effort: 'medium',
  currency: '',
  location: '',
  useDeviceLocation: true,
  locationRequested: false,
  locationPermission: 'unknown',
  theme: 'system',
  linkdingRefreshMinutes: 0,
  autoInterpretCommands: false,
  reducedMotion: false,
  musicNormalization: true,
};
export type Note = { path: string; title: string; modified: number; folder: boolean };
export type Document = { path: string; text: string; version: string };
export type Attachment = {
  id: string;
  name: string;
  size: number;
  mime: string;
  createdAt: number;
  supported: boolean;
  expired?: boolean;
};
export type Chat = RecordValue & {
  title: string;
  messages: any[];
  status: 'idle' | 'running' | 'interrupted' | 'error';
  error?: string;
  grants: string[];
  attachments: Attachment[];
};
export type Action = RecordValue & {
  owner: string;
  module: string;
  method: string;
  args: any;
  description: string;
  status: 'pending' | 'applying' | 'applied' | 'rejected' | 'failed';
  autoApproved?: boolean;
  result?: any;
  error?: string;
  before?: any;
};
export type AppEvent = {
  type: 'changed' | 'chat' | 'auth' | 'playback' | 'navigate';
  module?: string;
  id?: string;
  data?: any;
};
export type ApiResult<T = any> =
  | { ok: true; value: T }
  | { ok: false; error: string; code?: string; details?: any };
export interface ClarityApi {
  call<T = any>(method: string, args?: any): Promise<T>;
  subscribe(listener: (event: AppEvent) => void): () => void;
}
declare global {
  interface Window {
    clarity: ClarityApi;
  }
}
