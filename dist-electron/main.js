"use strict";
{
    app, ;
    BrowserWindow, ;
    session, ;
    ipcMain, ;
    protocol;
}
from;
"electron";
nimport;
 * ;
as;
path;
from;
"path";
nimport;
{
    ALLOWED_INVOKE, ;
    requireCapability;
}
from;
"\./main_ipc_registry";
n;
ntype;
PluginMeta;
{
    id: ;
    string;
    title: ;
    string;
    capabilities;
    string;
    [];
}
;
ntype;
GlobalWithRegistry;
typeof ;
globalThis;
 & ;
{
    __PLUGIN_REGISTRY__;
    PluginMeta;
    [];
}
;
nconst;
G;
globalThis;
as;
GlobalWithRegistry;
let mainWindow = null;
function createWindow() {
    mainWindow = new BrowserWindow({
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
    const startUrl = process.env.FAB_DASHBOARD_URL
        || `file://${path.join(process.cwd(), "fabric-main", "dist", "index.html")}`;
    mainWindow.loadURL(startUrl);
}
app.on("ready", async () => {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
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
    protocol.registerFileProtocol("safe", (request, cb) => {
        const url = request.url.replace("safe://", "");
        const resolved = path.normalize(path.join(process.cwd(), url));
        cb({ path: resolved });
    });
    ipcMain.handle("fabric:invoke", async (_e, payload) => {
        const { channel, data, capabilities = [] } = payload || {};
        if (!channel || !ALLOWED_INVOKE.has(channel))
            throw new Error("Blocked IPC channel");
        requireCapability(channel, capabilities);
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
    globalThis.__PLUGIN_REGISTRY__ = [];
    await createWindow();
});
app.on("window-all-closed", () => { if (process.platform !== "darwin")
    app.quit(); });
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0)
    createWindow(); });
