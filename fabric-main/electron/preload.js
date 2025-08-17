"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// electron/preload.ts
const electron_1 = require("electron");
// Helper to serialize Uint8Array safely across IPC (structured clone usually works,
// but we normalize to plain number[] for absolute safety where needed).
const toPlainBytes = (u8) => u8 instanceof Uint8Array ? Array.from(u8) : (u8 ?? []);
electron_1.contextBridge.exposeInMainWorld("fabricHost", {
    version: "1.0.0",
    // ------------------ Runtime ------------------
    runtime: {
        // Accepts op + args; host also supports the {command,payload} shape.
        invoke: (command, args) => electron_1.ipcRenderer.invoke("runtime.invoke", command, args),
    },
    // ------------------ Git ------------------
    git: {
        read: (path) => electron_1.ipcRenderer.invoke("git.read", path),
        write: (path, text, message) => electron_1.ipcRenderer.invoke("git.write", { path, text, message }),
        exists: (path) => electron_1.ipcRenderer.invoke("git.exists", path),
        list: (dir) => electron_1.ipcRenderer.invoke("git.list", dir),
        pull: () => electron_1.ipcRenderer.invoke("git.pull"),
        push: (message) => electron_1.ipcRenderer.invoke("git.push", { message }),
    },
    // ------------------ Licenses ------------------
    licenses: {
        list: () => electron_1.ipcRenderer.invoke("licenses.list"),
        import: (bytes) => 
        // If your main handler expects a Uint8Array directly, this is fine.
        // If you standardized on plain arrays, switch to toPlainBytes(bytes).
        electron_1.ipcRenderer.invoke("licenses.import", bytes),
        verify: (licId) => electron_1.ipcRenderer.invoke("licenses.verify", licId),
        revoke: (licId) => electron_1.ipcRenderer.invoke("licenses.revoke", licId),
    },
    // ------------------ Provenance ------------------
    // Host expects a single delta object; do NOT split into event/payload.
    provenance: {
        emit: (delta) => electron_1.ipcRenderer.invoke("provenance.emit", delta),
    },
    // ------------------ Security ------------------
    security: {
        getCRL: () => electron_1.ipcRenderer.invoke("security.getCRL"),
        verifySignature: (payload, signature, publicKeyId) => electron_1.ipcRenderer.invoke("security.verifySignature", {
            payload: toPlainBytes(payload),
            signature: toPlainBytes(signature),
            kid: publicKeyId,
        }),
    },
    // ------------------ Routes ------------------
    registerRoutes: (defs) => electron_1.ipcRenderer.invoke("routes.register", defs),
    // ------------------ Permissions ------------------
    permissions: () => electron_1.ipcRenderer.invoke("permissions"),
});
