// electron/preload.ts
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("fabricHost", {
  version: "1.0.0",

  runtime: {
    invoke: (command: string, payload?: any) =>
      ipcRenderer.invoke("runtime.invoke", { command, payload }),
  },

  git: {
    read:   (p: string) => ipcRenderer.invoke("git.read", p),
    write:  (p: string, text: string, message?: string) => ipcRenderer.invoke("git.write", { path: p, text, message }),
    exists: (p: string) => ipcRenderer.invoke("git.exists", p),
    list:   (dir: string) => ipcRenderer.invoke("git.list", dir),
    pull:   () => ipcRenderer.invoke("git.pull"),
    push:   (msg?: string) => ipcRenderer.invoke("git.push", msg),
  },

  licenses: {
    list:   () => ipcRenderer.invoke("licenses.list"),
    import: (bytes: Uint8Array) => ipcRenderer.invoke("licenses.import", bytes),
    // seat activation is routed through runtime.invoke('license.activate') in main.ts
  },

  provenance: {
    emit: (delta: Record<string, any>) => ipcRenderer.invoke("provenance.emit", delta),
  },

  security: {
    getCRL: () => ipcRenderer.invoke("security.getCRL"),
    verifySignature: (payload: Uint8Array, signature: Uint8Array, kid: string) =>
      ipcRenderer.invoke("security.verifySignature", { payload: Array.from(payload), signature: Array.from(signature), kid }),
  },

  permissions: () => ipcRenderer.invoke("permissions"),
});

