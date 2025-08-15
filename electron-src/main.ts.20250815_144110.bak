import { app, BrowserWindow, session, ipcMain, protocol } from "electron";
import * as path from "path";
import { ALLOWED_INVOKE, requireCapability } from "./main_ipc_registry";

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: "#0b0f14",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      disableBlinkFeatures: "Auxclick",
    },
  });

  // Lock down navigation / new window
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.webContents.on("will-navigate", (e) => e.preventDefault());

  // Load local index.html (served by Vite build or dev server proxy)
  const startUrl = process.env.FAB_DASHBOARD_URL || `file://${path.join(process.cwd(), "fabric-main", "dist", "index.html")}`;
  mainWindow.loadURL(startUrl);
}

app.commandLine.appendSwitch("disable-features", "CrossOriginOpenerPolicyByDefault");

app.on("ready", async () => {
  // Strong CSP for all requests from the app
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
      ...details.responseHeaders,
      "Content-Security-Policy": [csp],
      "X-Content-Type-Options": ["nosniff"],
      "X-Frame-Options": ["DENY"],
      "Referrer-Policy": ["no-referrer"],
      "Permissions-Policy": ["geolocation=(), microphone=(), camera=()"]
    };
    callback({ responseHeaders: headers });
  });

  // Register custom safe file protocol for local assets if needed
  protocol.registerFileProtocol("safe", (request, cb) => {
    const url = request.url.replace("safe://", "");
    const resolved = path.normalize(path.join(process.cwd(), url));
    cb({ path: resolved });
  });

  // Harden IPC: one invoke channel, with explicit allowlist
  ipcMain.handle("fabric:invoke", async (_e, payload: { channel: string; data?: any; capabilities?: string[] }) => {
    const { channel, data, capabilities = [] } = payload || {};
    if (!channel || !ALLOWED_INVOKE.has(channel)) {
      throw new Error("Blocked IPC channel");
    }
    // Capability gating per channel
    requireCapability(channel, capabilities);

    // Example handlers (extend as needed)
    switch (channel) {
      case "plugin:list":
        return globalThis.__PLUGIN_REGISTRY__ ?? [];
      case "plugin:get":
        return (globalThis.__PLUGIN_REGISTRY__ ?? []).find((p: any) => p.id === data?.id) ?? null;
      case "env:version":
        return { electron: process.versions.electron, node: process.versions.node, chrome: process.versions.chrome };
      default:
        throw new Error("No handler implemented");
    }
  });

  // Minimal plugin registry boot (host-owned)
  (globalThis as any).__PLUGIN_REGISTRY__ = [];

  await createWindow();
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
