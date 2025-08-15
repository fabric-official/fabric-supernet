import { contextBridge } from "electron";
contextBridge.exposeInMainWorld("fabric", { version: "1.0.0" });
