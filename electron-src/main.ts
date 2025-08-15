import { app, BrowserWindow } from "electron";
import * as path from "path";
import "./main_ipc_registry"; // registers handlers

function getHomeHash(): string {
  const raw = process.env.DASH_HOME_HASH || "";
  return raw.replace(/^#\/?/, "").replace(/^\//, "");
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 860,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js")
    }
  });
  const indexHtml = path.join(__dirname, "../fabric-main/dist/index.html");
  await win.loadFile(indexHtml, { hash: getHomeHash() });
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
