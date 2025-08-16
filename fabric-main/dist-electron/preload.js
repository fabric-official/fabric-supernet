"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('fabricHost', {
    version: '1.0.0',
    runtime: {
        invoke: (command, payload) => electron_1.ipcRenderer.invoke('runtime.invoke', { command, payload }),
    },
    git: {
        read: (path) => electron_1.ipcRenderer.invoke('git.read', path),
        write: (path, text) => electron_1.ipcRenderer.invoke('git.write', { path, text }),
        exists: (path) => electron_1.ipcRenderer.invoke('git.exists', path),
    },
    licenses: { list: () => electron_1.ipcRenderer.invoke('licenses.list') },
    provenance: { emit: (event, payload) => electron_1.ipcRenderer.invoke('provenance.emit', { event, payload }) },
    security: { getCRL: () => electron_1.ipcRenderer.invoke('security.getCRL') },
    permissions: () => electron_1.ipcRenderer.invoke('permissions'),
});
//# sourceMappingURL=preload.js.map