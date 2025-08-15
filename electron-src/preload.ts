import { contextBridge, ipcRenderer } from "electron";
const api = Object.freeze({
  invoke: async (channel: string, data?: any, capabilities: string[] = []) =>
    ipcRenderer.invoke("fabric:invoke", { channel, data, capabilities })
});
contextBridge.exposeInMainWorld("fabric", api);
