import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('fabricHost', {
  version: '1.0.0',
  runtime: {
    invoke: (command: string, payload?: any) =>
      ipcRenderer.invoke('runtime.invoke', { command, payload }),
  },
  git: {
    read: (path: string) => ipcRenderer.invoke('git.read', path),
    write: (path: string, text: string) => ipcRenderer.invoke('git.write', { path, text }),
    exists: (path: string) => ipcRenderer.invoke('git.exists', path),
  },
  licenses: { list: () => ipcRenderer.invoke('licenses.list') },
  provenance: { emit: (event: string, payload: any) => ipcRenderer.invoke('provenance.emit', { event, payload }) },
  security: { getCRL: () => ipcRenderer.invoke('security.getCRL') },
  permissions: () => ipcRenderer.invoke('permissions'),
});