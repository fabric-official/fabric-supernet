"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const api = Object.freeze({
    invoke: async (channel, data, capabilities = []) => electron_1.ipcRenderer.invoke("fabric:invoke", { channel, data, capabilities })
});
electron_1.contextBridge.exposeInMainWorld("fabric", api);
