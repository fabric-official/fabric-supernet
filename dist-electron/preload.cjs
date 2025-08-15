const { contextBridge } = require("electron");
contextBridge.exposeInMainWorld("fabric", { version: "1.0.0" });
