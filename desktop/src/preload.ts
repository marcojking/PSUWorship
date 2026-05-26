import { contextBridge, ipcRenderer } from 'electron'

type Listed = { id: string; name: string; date: string }
type DisplayInfo = { id: number; label: string; width: number; height: number; primary: boolean }

contextBridge.exposeInMainWorld('wma', {
  getDisplays: (): Promise<DisplayInfo[]> => ipcRenderer.invoke('get-displays'),
  listSetlists: (): Promise<Listed[]> => ipcRenderer.invoke('list-setlists'),
  refreshLibrary: (): Promise<{ ok: boolean; setlists?: Listed[]; error?: string }> =>
    ipcRenderer.invoke('refresh-library'),
  selectSetlist: (id: string): Promise<{ ok: boolean }> => ipcRenderer.invoke('select-setlist', id),
  action: (event: unknown): Promise<unknown> => ipcRenderer.invoke('action', event),
  getPayload: (): Promise<unknown> => ipcRenderer.invoke('get-payload'),
  openWindow: (kind: 'projector' | 'monitor', displayId: number): Promise<{ ok: boolean }> =>
    ipcRenderer.invoke('open-window', kind, displayId),
  setBroadcast: (on: boolean): Promise<{ broadcast: boolean }> => ipcRenderer.invoke('set-broadcast', on),
  getConfig: (): Promise<{ broadcast: boolean; convexUrl: string; connected: boolean }> =>
    ipcRenderer.invoke('get-config'),
  onPayload: (cb: (payload: unknown) => void) => {
    ipcRenderer.on('payload', (_e, payload) => cb(payload))
  },
  onLibraryUpdated: (cb: (setlists: Listed[]) => void) => {
    ipcRenderer.on('library-updated', (_e, setlists) => cb(setlists))
  },
})
