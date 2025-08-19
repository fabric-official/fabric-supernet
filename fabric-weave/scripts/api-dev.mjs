import http from "http";
import { URL } from "url";
import os from "os";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";

const PORT = Number(process.env.PORT || process.argv[2] || 8787);
const ROOT = process.cwd();
const INSTALLER = path.join(ROOT, "scripts", "plugin-installer.mjs");
const nodeBin = process.execPath;

async function downloadToFile(url, destDir, filename) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(destDir, { recursive: true });
  const abs = path.join(destDir, filename);
  fs.writeFileSync(abs, buf);
  return abs;
}

function runInstaller(cmd, arg) {
  return new Promise((resolve, reject) => {
    const p = spawn(nodeBin, [INSTALLER, cmd, arg], { cwd: ROOT, stdio: "pipe" });
    let out = "", err = "";
    p.stdout.on("data", d => out += d.toString());
    p.stderr.on("data", d => err += d.toString());
    p.on("close", code => code === 0 ? resolve(out.trim()) : reject(new Error(err || out)));
  });
}

function json(res, code, body) {
  res.writeHead(code, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === "POST" && u.pathname === "/api/plugins/install") {
      let raw = "";
      req.on("data", c => raw += c);
      req.on("end", async () => {
        try {
          const payload = raw ? JSON.parse(raw) : {};
          const { url, id, version } = payload;
          if (!url || !id) { json(res, 400, { error: "Missing url or id" }); return; }

          const dlDir = path.join(os.tmpdir(), "fabric-appstore");
          const fname = `${id}-${version || "0.0.0"}.tgz`;
          const tgzPath = await downloadToFile(url, dlDir, fname);

          const out = await runInstaller("install", tgzPath);
          json(res, 200, { ok: true, out });
        } catch (e) {
          json(res, 500, { ok: false, error: e.message });
        }
      });
      return;
    }

    if (req.method === "POST" && u.pathname === "/api/plugins/uninstall") {
      let raw = "";
      req.on("data", c => raw += c);
      req.on("end", async () => {
        try {
          const { id } = raw ? JSON.parse(raw) : {};
          if (!id) { json(res, 400, { error: "Missing id" }); return; }
          const out = await runInstaller("uninstall", id);
          json(res, 200, { ok: true, out });
        } catch (e) {
          json(res, 500, { ok: false, error: e.message });
        }
      });
      return;
    }

    json(res, 404, { error: "Not found" });
  } catch (e) {
    json(res, 500, { error: e.message });
  }
});

server.listen(PORT, () => {
  console.log(` App Store API listening on http://127.0.0.1:${PORT}`);
});
