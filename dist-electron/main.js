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
const main_ipc_registry_1 = require("./main_ipc_registry");
const G = globalThis;
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1280,
        height: 800,
        backgroundColor: "#0b0f14",
        show: true,
        webPreferences: {
            preload: path.join(__dirname, "preload.cjs"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            webSecurity: true,
            disableBlinkFeatures: "Auxclick"
        }
    });
    mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    mainWindow.webContents.on("will-navigate", (e) => e.preventDefault());
    const startUrl = process.env.FAB_DASHBOARD_URL ||
        `file://${path.join(process.cwd(), "fabric-main", "dist", "index.html")}`;
    void mainWindow.loadURL(startUrl);
}
electron_1.app.on("ready", async () => {
    electron_1.session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        const csp = [
            "default-src 'self'",
            "script-src 'self'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data:",
            "font-src 'self'",
            "connect-src 'self'",
            "frame-ancestors 'none'",
            "object-src 'none'",
            "base-uri 'none'"
        ].join("; ");
        const headers = {
            ...(details.responseHeaders || {}),
            "Content-Security-Policy": [csp],
            "X-Content-Type-Options": ["nosniff"],
            "X-Frame-Options": ["DENY"],
            "Referrer-Policy": ["no-referrer"],
            "Permissions-Policy": ["geolocation=(), microphone=(), camera=()"]
        };
        callback({ responseHeaders: headers });
    });
    electron_1.protocol.registerFileProtocol("safe", (request, cb) => {
        const url = request.url.replace("safe://", "");
        const resolved = path.normalize(path.join(process.cwd(), url));
        cb({ path: resolved });
    });
    electron_1.ipcMain.handle("fabric:invoke", async (_e, payload) => {
        const { channel, data, capabilities = [] } = payload || {};
        if (!channel || !main_ipc_registry_1.ALLOWED_INVOKE.has(channel))
            throw new Error("Blocked IPC channel");
        (0, main_ipc_registry_1.requireCapability)(channel, capabilities);
        switch (channel) {
            case "plugin:list":
                return G.__PLUGIN_REGISTRY__ ?? [];
            case "plugin:get":
                return (G.__PLUGIN_REGISTRY__ ?? []).find((p) => p.id === data?.id) ?? null;
            case "env:version":
                return { electron: process.versions.electron, node: process.versions.node, chrome: process.versions.chrome };
            default:
                throw new Error("No handler implemented");
        }
    });
    G.__PLUGIN_REGISTRY__ = [];
    await createWindow();
});
electron_1.app.on("window-all-closed", () => { if (process.platform !== "darwin")
    electron_1.app.quit(); });
electron_1.app.on("activate", () => { if (electron_1.BrowserWindow.getAllWindows().length === 0)
    createWindow(); });
