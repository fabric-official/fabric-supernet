"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const fs = __importStar(require("fs/promises"));
function fpFromHost() {
    const name = os.hostname();
    const cpu = os.cpus()?.[0]?.model ?? "cpu";
    const total = os.totalmem();
    return Buffer.from(`${name}|${cpu}|${total}`).toString("base64").slice(0, 24);
}
async function createWindow() {
    const win = new electron_1.BrowserWindow({
        width: 1280, height: 800,
        webPreferences: {
            // when running the compiled JS from dist-electron, __dirname points to that folder
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    await win.loadURL("http://127.0.0.1:5174/");
}
electron_1.app.whenReady().then(() => {
    createWindow();
    electron_1.app.on("activate", () => { if (electron_1.BrowserWindow.getAllWindows().length === 0)
        createWindow(); });
});
electron_1.app.on("window-all-closed", () => { if (process.platform !== "darwin")
    electron_1.app.quit(); });
// ---- IPC: minimal real logic identifying THIS computer ----
electron_1.ipcMain.handle("runtime.invoke", async (_e, { command, payload }) => {
    switch (command) {
        case "device.list": {
            const now = new Date().toISOString();
            return [{
                    fp: fpFromHost(),
                    name: os.hostname(),
                    role: "edge",
                    online: true,
                    lastHeartbeat: now,
                    enrolledAt: now,
                    pubkey: undefined,
                }];
        }
        case "device.enroll":
            return { success: true };
        case "wifi.scan":
            return { ssids: [], success: true };
        default:
            return { success: true };
    }
});
electron_1.ipcMain.handle("git.read", async (_e, p) => { try {
    return await fs.readFile(p, "utf8");
}
catch {
    return "{}";
} });
electron_1.ipcMain.handle("git.write", async (_e, { path: p, text }) => { await fs.writeFile(p, text, "utf8"); return true; });
electron_1.ipcMain.handle("git.exists", async (_e, p) => { try {
    await fs.access(p);
    return true;
}
catch {
    return false;
} });
electron_1.ipcMain.handle("licenses.list", async () => []);
electron_1.ipcMain.handle("provenance.emit", async () => true);
electron_1.ipcMain.handle("security.getCRL", async () => ({ revoked: [], updated_at: new Date().toISOString() }));
electron_1.ipcMain.handle("permissions", async () => []);
//# sourceMappingURL=main.js.map