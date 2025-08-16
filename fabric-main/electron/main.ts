import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import * as os from "os";
import * as fs from "fs/promises";

function fpFromHost(): string {
  const name = os.hostname();
  const cpu = os.cpus()?.[0]?.model ?? "cpu";
  const total = os.totalmem();
  return Buffer.from(`${name}|${cpu}|${total}`).toString("base64").slice(0, 24);
}

async function createWindow() {
  const win = new BrowserWindow({
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

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });

// ---- IPC: minimal real logic identifying THIS computer ----
ipcMain.handle("runtime.invoke", async (_e, { command, payload }) => {
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

ipcMain.handle("git.read",   async (_e, p: string) => { try { return await fs.readFile(p, "utf8"); } catch { return "{}"; } });
ipcMain.handle("git.write",  async (_e, { path: p, text }: { path: string, text: string }) => { await fs.writeFile(p, text, "utf8"); return true; });
ipcMain.handle("git.exists", async (_e, p: string) => { try { await fs.access(p); return true; } catch { return false; } });
ipcMain.handle("licenses.list",   async () => []);
ipcMain.handle("provenance.emit", async () => true);
ipcMain.handle("security.getCRL", async () => ({ revoked: [], updated_at: new Date().toISOString() }));
ipcMain.handle("permissions",     async () => []);
