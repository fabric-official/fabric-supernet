import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("FabricInstaller", {
  install: (tgzAbsPath: string) => ipcRenderer.invoke("fabric:install", tgzAbsPath),
  uninstall: (pluginId: string) => ipcRenderer.invoke("fabric:uninstall", pluginId),
  saveBinaryToDisk: (data: ArrayBuffer, filename: string) =>
    ipcRenderer.invoke("fabric:saveBinary", data, filename),
});
