// electron/main.ts
import { app, BrowserWindow, ipcMain, session, shell, Menu } from "electron";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import fsp from "node:fs/promises";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

// ---------- ESM-safe __dirname ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- Dynamic load of licenses module (TS or JS) ----------
type LicMod = {
  registerLicenseIPC: () => void;
  activateSeat: (licId: string, pkg: string, deviceFp: string) => Promise<{ ok: true }>;
};
async function loadLicMod(): Promise<LicMod> {
  const candidates = [
    new URL("./ipc/licenses.ts", import.meta.url),
    new URL("./ipc/licenses.js", import.meta.url),
    new URL("../dist-electron/ipc/licenses.js", import.meta.url),
  ];
  for (const u of candidates) {
    try {
      const m: any = await import(u.href);
      if (m?.registerLicenseIPC && m?.activateSeat) return m as LicMod;
    } catch {}
  }
  throw new Error("licenses module not found (expected electron/ipc/licenses.ts or .js)");
}

// ---------- Security & Single Instance ----------
if (!app.requestSingleInstanceLock()) app.quit();
app.disableHardwareAcceleration();
app.commandLine.appendSwitch("disable-site-isolation-trials");
app.setAppLogsPath();
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";

// Pin app name + userData **early** so every module sees the same path
app.setName("FabricSupernet");
app.setPath("userData", path.join(app.getPath("appData"), "FabricSupernet"));

// ---------- Globals ----------
const isDev = !!process.env.VITE_DEV_SERVER_URL || process.env.NODE_ENV === "development";
const userData = app.getPath("userData");
const preloadPath = path.join(__dirname, "preload.js");

// ---------- Helpers ----------
async function atomicWrite(filePath: string, bytes: Buffer) {
  const tmp = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  await fsp.writeFile(tmp, bytes, { mode: 0o600 });
  try { const fh = await fsp.open(tmp, "r"); await fh.sync(); await fh.close(); } catch {}
  await fsp.rename(tmp, filePath);
  try { await fsp.chmod(filePath, 0o600); } catch {}
}

function fpFromHost(): string {
  const name = os.hostname();
  const cpu = os.cpus()?.[0]?.model ?? "cpu";
  const total = os.totalmem();
  const saltPath = path.join(userData, "host_salt.bin");
  let salt: Buffer;
  try {
    salt = fs.readFileSync(saltPath);
    if (salt.length !== 16) throw new Error();
  } catch {
    salt = crypto.randomBytes(16);
    fs.mkdirSync(path.dirname(saltPath), { recursive: true });
    fs.writeFileSync(saltPath, salt, { mode: 0o600 });
  }
  const h = crypto.createHash("sha256").update(`${name}|${cpu}|${total}`).update(salt).digest("base64url");
  return h.slice(0, 24);
}

// ---------- BrowserWindow ----------
let win: BrowserWindow | null = null;

async function safeLoadFile() {
  try {
    if (win && !win.isDestroyed()) {
      await win.loadFile(path.join(__dirname, "../dist/index.html"));
    }
  } catch {}
}

async function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    backgroundColor: "#0b0b0c",
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      devTools: !!isDev,
    },
  });

  // Hide default menu (dashboard only)
  Menu.setApplicationMenu(null);

  // External links open in browser; everything else denied
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) shell.openExternal(url).catch(() => {});
    return { action: "deny" };
  });

  // Allow our app navigations: file:// (built SPA), app://, or (dev) localhost
  win.webContents.on("will-navigate", (e, url) => {
    const devUrl = process.env.VITE_DEV_SERVER_URL || "";
    const allowed =
      url.startsWith("file://") ||
      url.startsWith("app://")  ||
      (isDev && (
        (devUrl && url.startsWith(devUrl)) ||
        url.startsWith("http://127.0.0.1:") ||
        url.startsWith("http://localhost:")
      ));
    if (!allowed) e.preventDefault();
  });

  // If load fails (e.g., dev server down), fall back to built index.html
  win.webContents.on("did-fail-load", () => { void safeLoadFile(); });

  const ses = session.fromPartition("persist:default");
  try { ses.protocol.registerStringProtocol("app", (_req, cb) => cb("")); } catch (e) { console.error(e); }

  ses.webRequest.onHeadersReceived((details, callback) => {
    const csp =
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: blob:; " +
      "font-src 'self' data:; " +
      "connect-src 'self' http://127.0.0.1:* ws://127.0.0.1:* http://localhost:* ws://localhost:*; " +
      "media-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'self';";
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [csp],
        "Cross-Origin-Opener-Policy": ["same-origin"],
        "Cross-Origin-Embedder-Policy": ["require-corp"],
        "Cross-Origin-Resource-Policy": ["same-origin"],
      },
    });
  });

  // Try dev URL; if it throws immediately, fall back to dist
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    try {
      await win.loadURL(process.env.VITE_DEV_SERVER_URL);
    } catch {
      await safeLoadFile();
    }
  } else {
    await safeLoadFile();
  }

  win.on("ready-to-show", () => win && win.show());
  win.on("closed", () => (win = null));
}

// ---------- App lifecycle ----------
app.whenReady().then(async () => {
  // Strict permissions
  session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => cb(false));

  // Guard against duplicate handlers the license module might add
  const realHandle = (ipcMain as any).handle.bind(ipcMain);
  const registered = new Set<string>();
  (ipcMain as any).handle = (channel: string, listener: any) => {
    if (registered.has(channel)) {
      if (channel === "runtime.invoke") {
        console.warn("[main] skipping duplicate handler for runtime.invoke (license module)");
        return;
      }
      console.warn(`[main] skipping duplicate handler for ${channel}`);
      return;
    }
    registered.add(channel);
    realHandle(channel, listener);
  };

  // Load license module and register its IPC (licenses.list/import/etc).
  const lic = await loadLicMod();
  lic.registerLicenseIPC();

  // Startup diagnostics: exact license dir + files
  const licDirAbs = path.join(userData, "licenses");
  console.info(`[main] userData = ${userData}`);
  console.info(`[main] licenses dir = ${licDirAbs}`);
  try {
    const names = fs.existsSync(licDirAbs) ? fs.readdirSync(licDirAbs) : [];
    console.info(`[main] licenses present: ${names.join(", ") || "(none)"}`);
  } catch (e) {
    console.warn("[main] failed to enumerate licenses:", e);
  }

  await createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow();
  });
});

app.on("second-instance", () => {
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });

// ---------- IPC: Runtime / Git / Provenance / Security ----------
// NOTE: All *license* handlers (licenses.list/import/etc) live in electron/ipc/licenses.ts.
// We only expose a consolidated runtime.invoke here and delegate license.activate to the module.

let licModulePromise: Promise<LicMod> | null = null;
function getLic() {
  if (!licModulePromise) licModulePromise = loadLicMod();
  return licModulePromise;
}

ipcMain.handle("runtime.invoke", async (_e, opOrObj: any, maybeArgs?: any) => {
  const isObj = typeof opOrObj === "object" && opOrObj !== null;
  const op = isObj ? opOrObj.command : opOrObj;
  const args = isObj ? opOrObj.payload : maybeArgs;

  switch (op) {
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
    case "device.enroll": return { ok: true };
    case "wifi.scan":     return { ok: true, ssids: [] };

    case "license.activate": {
      const { licId, pkg, deviceFp } = args || {};
      if (!licId || !pkg || !deviceFp) throw new Error("ERR_INVALID_ARGS");
      const lic = await getLic();
      return lic.activateSeat(String(licId), String(pkg), String(deviceFp));
    }

    default: return { ok: true };
  }
});

// ---------- GIT IPC (shape-tolerant: object OR positional args) ----------
function pickPath(arg: any): string | undefined {
  if (typeof arg === "string") return arg;
  if (arg && typeof arg === "object") {
    return arg.path ?? arg.p ?? arg.file ?? arg.target ?? arg.fullpath;
  }
  return undefined;
}

ipcMain.handle("git.read", async (_e, ...args: any[]) => {
  const p = pickPath(args[0]);
  try {
    if (!p) throw 0;
    return await fsp.readFile(p, "utf8");
  } catch {
    return "{}";
  }
});

ipcMain.handle("git.write", async (_e, ...args: any[]) => {
  let p: string | undefined;
  let text = "";
  if (args.length === 1 && typeof args[0] === "object") {
    p = pickPath(args[0]);
    text = String(args[0]?.text ?? "");
  } else {
    p = pickPath(args[0]);
    text = String(args[1] ?? "");
  }
  if (!p) throw new Error("ERR_INVALID_PATH");
  await atomicWrite(p, Buffer.from(text, "utf8"));
  return true;
});

ipcMain.handle("git.exists", async (_e, ...args: any[]) => {
  const p = pickPath(args[0]);
  try {
    if (!p) throw 0;
    await fsp.access(p);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle("git.list", async (_e, ...args: any[]) => {
  const dir = pickPath(args[0]) ?? (typeof args[0] === "string" ? args[0] : undefined);
  try {
    if (!dir) throw 0;
    return await fsp.readdir(dir);
  } catch {
    return [];
  }
});

ipcMain.handle("git.pull", async () => { return; });
ipcMain.handle("git.push", async () => { return; });

// ---------- Provenance ----------
ipcMain.handle("provenance.emit", async (_e, delta: any) => {
  try {
    const logPath = path.join(userData, "logs", "provenance.jsonl");
    await fsp.mkdir(path.dirname(logPath), { recursive: true });
    await fsp.appendFile(
      logPath,
      Buffer.from(JSON.stringify({ ts: new Date().toISOString(), delta }) + "\n"),
      { mode: 0o600 }
    );
    return true;
  } catch { return false; }
});

// ---------- Security ----------
ipcMain.handle("security.getCRL", async () => {
  try {
    const raw = await fsp.readFile(path.join(userData, "crl.json"), "utf8");
    const crl = JSON.parse(raw);
    return { revoked: Array.isArray(crl?.revoked) ? crl.revoked : [], updated_at: crl?.generated_at ?? new Date().toISOString() };
  } catch {
    return { revoked: [], updated_at: new Date().toISOString() };
  }
});

ipcMain.handle("security.verifySignature", async (_e, { payload, signature, kid }: { payload: number[]; signature: number[]; kid: string }) => {
  try {
    const caDir = path.join(userData, "ca");
    const files = fs.existsSync(caDir) ? fs.readdirSync(caDir).filter(f => f.endsWith(".pub") && (!kid || f.includes(kid))) : [];
    const msg = Buffer.from(payload);
    const sig = Buffer.from(signature);
    for (const f of files) {
      try {
        const key = crypto.createPublicKey(fs.readFileSync(path.join(caDir, f)));
        if (crypto.verify(null, msg, key, sig)) return true;
      } catch {}
    }
    return false;
  } catch { return false; }
});

ipcMain.handle("routes.register", async () => true);






