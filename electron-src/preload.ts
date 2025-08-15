import { contextBridge, ipcRenderer } from "electron";

const api = {
  invoke: async (channel: string, data?: any, capabilities: string[] = []) => {
    return await ipcRenderer.invoke("fabric:invoke", { channel, data, capabilities });
  },
};

contextBridge.exposeInMainWorld("fabric", Object.freeze(api));
