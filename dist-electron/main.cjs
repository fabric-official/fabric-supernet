const { app, BrowserWindow } = require("electron");
const path = require("path");

function getHomeHash() {
  const raw = process.env.DASH_HOME_HASH || "";
  return raw.replace(/^#\/?/, "").replace(/^\//, ""); // '' -> '#/', 'apps' -> '#/apps'
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 860,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
    }
  });

  const hash = getHomeHash();
  const indexHtml = path.join(__dirname, "../fabric-main/dist/index.html");
  await win.loadFile(indexHtml, { hash });
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
