const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("fab", {
  scanWifi: () => ipcRenderer.invoke("wifi.scan"),
  onAdmin: (cb) => ipcRenderer.on("admin.open", cb)
});
