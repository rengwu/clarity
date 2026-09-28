import { contextBridge, ipcRenderer } from 'electron';
import type { AppEvent, ApiResult } from '../shared/types';

contextBridge.exposeInMainWorld('clarity', {
  call: async (method: string, args?: any) => {
    const result: ApiResult = await ipcRenderer.invoke('clarity:call', method, args);
    if (!result.ok)
      throw Object.assign(new Error(result.error), { code: result.code, details: result.details });
    return result.value;
  },
  subscribe: (listener: (event: AppEvent) => void) => {
    const handler = (_event: any, payload: AppEvent) => listener(payload);
    ipcRenderer.on('clarity:event', handler);
    return () => ipcRenderer.removeListener('clarity:event', handler);
  },
});
