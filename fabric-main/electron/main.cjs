const { app, BrowserWindow, ipcMain, globalShortcut } = require("electron");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

function parseNetsh(stdout) {
  const nets = [];
  let cur = null;
  for (const raw of stdout.split(/\\r?\\n/)) {
    const line = raw.trim();
    let m;
    if ((m = line.match(/^SSID\\s+\\d+\\s*:\\s*(.*)$/i))) {
      if (cur) nets.push(cur);
      cur = { ssid: m[1].trim(), bssids: [] };
      continue;
    }
    if ((m = line.match(/^BSSID\\s+\\d+\\s*:\\s*(.*)$/i))) {
      cur && cur.bssids.push({ bssid: m[1].trim() });
      continue;
    }
    if ((m = line.match(/^Signal\\s*:\\s*(.*)$/i))) {
      const last = cur && cur.bssids[cur.bssids.length - 1];
      if (last) last.signal = m[1].trim();
      else if (cur) cur.signal = m[1].trim();
      continue;
    }
    if ((m = line.match(/^Channel\\s*:\\s*(.*)$/i))) {
      const last = cur && cur.bssids[cur.bssids.length - 1];
      if (last) last.channel = m[1].trim();
      else if (cur) cur.channel = m[1].trim();
      continue;
    }
    if ((m = line.match(/^Authentication\\s*:\\s*(.*)$/i))) {
      if (cur) cur.auth = m[1].trim();
      continue;
    }
  }
  if (cur) nets.push(cur);
  return nets;
}

ipcMain.handle("wifi.scan", async () => {
  return new Promise((resolve, reject) => {
    exec("netsh wlan show networks mode=bssid", { windowsHide: true }, (err, stdout) => {
      if (err) return reject(new Error("netsh failed: " + err.message));
      try {
        const networks = parseNetsh(stdout);
        resolve({ success: true, networks });
      } catch (e) {
        reject(e);
      }
    });
  });
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.cjs")
    }
  });

  // Load built Vite app at ./dist/index.html
  const dist = path.join(process.cwd(), "dist", "index.html");
  if (fs.existsSync(dist)) {
    win.loadFile(dist);
  } else {
    win.loadURL("data:text/plain,Build not found. Run `npm run build` first.");
  }
}

app.whenReady().then(() => {
  createWindow();
  try {
    globalShortcut.register("Control+Shift+A", () => {
      const w = BrowserWindow.getAllWindows()[0];
      if (w) w.webContents.send("admin.open");
    });
  } catch {}
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
