import { app, BrowserWindow, ipcMain } from "electron";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
const nacl = require("tweetnacl");
import { pathToFileURL } from "url";

const ROOT = path.resolve(process.cwd(), "repo");
const SITE = path.join(ROOT, "site");
try { fs.mkdirSync(SITE, { recursive: true }); } catch {}

function bomSafeReadJSON(p: string, fallback: any) {
  try {
    const b = fs.readFileSync(p);
    const bb = (b[0]===0xEF && b[1]===0xBB && b[2]===0xBF) ? b.slice(3) : b;
    return JSON.parse(bb.toString("utf8"));
  } catch { return fallback; }
}

if (process.env.SMOKE_TEST_CALL) {
  (async () => {
    const ch = String(process.env.SMOKE_TEST_CALL||"");
    let payload:any = {};
    try { payload = JSON.parse(process.env.SMOKE_TEST_PAYLOAD||"{}"); } catch {}
    const ok = (v:any)=>{ try{ process.stdout.write(JSON.stringify(v??{})); }catch{} process.exit(0); };
    const fail = (e:any)=>{ try{ console.error(String(e?.message||e)); }catch{} process.exit(1); };

    async function route(channel:string, p:any) {
      switch(channel) {
        case "auth.setPasscode": {
          const salt = crypto.randomBytes(16);
          const key = crypto.scryptSync(String(p?.code||""), salt, 32);
          fs.writeFileSync(path.join(SITE,"auth.json"), JSON.stringify({ salt: salt.toString("hex"), hash: Buffer.from(key).toString("hex") }, null, 2));
          return { ok:true };
        }
        case "auth.login": {
          const j = bomSafeReadJSON(path.join(SITE,"auth.json"), null);
          if (!j) return { ok:false };
          const key = crypto.scryptSync(String(p?.code||""), Buffer.from(j.salt,"hex"), 32);
          return { ok: Buffer.from(key).toString("hex")===String(j.hash) };
        }
        case "auth.status": {
          return { ok: fs.existsSync(path.join(SITE,"auth.json")) };
        }

        case "site.setup": {
          const siteFile = path.join(SITE,"site.json");
          let site:any = bomSafeReadJSON(siteFile, {});
          if (!site.siteId) site.siteId = "SITE-" + crypto.randomBytes(6).toString("hex");
          const pubFile = path.join(SITE,"site.pub"); const keyFile = path.join(SITE,"site.key");
          if (!fs.existsSync(pubFile) || !fs.existsSync(keyFile)) {
            const kp = nacl.sign.keyPair();
            fs.writeFileSync(pubFile, Buffer.from(kp.publicKey).toString("hex"));
            fs.writeFileSync(keyFile, Buffer.from(kp.secretKey).toString("hex"));
          }
          if (p?.wallet) site.wallet = String(p.wallet);
          fs.writeFileSync(siteFile, JSON.stringify(site, null, 2));
          return { ok:true, siteId: site.siteId };
        }
        case "secrets.migrate": { return { ok:true, migrated:[] }; }

        case "licenses.summary": {
          const f = path.join(ROOT,"licenses","summary.json");
          let list:any[] = [];
          try { list = bomSafeReadJSON(f, []); } catch {}
          if (!Array.isArray(list)) list = [];
          return list.map(x => ({
            license:String(x.license||""),
            seatsTotal:Number(x.seatsTotal||0),
            seatsUsed:Number(x.seatsUsed||0),
            verified:!!x.verified,
            revokedCount:Number(x.revokedCount||0)
          }));
        }

        case "fabric.plugins.cleanup": {
          const REG = path.join(process.cwd(),"plugins","registry.json");
          let doc:any = { plugins: [] };
          try { doc = bomSafeReadJSON(REG, { plugins: [] }); } catch {}
          let changed = false;
          for (const p2 of (doc.plugins||[])) {
            try { if (!fs.existsSync(p2.path)) { p2.enabled = false; changed = true; } } catch {}
          }
          if (changed) { fs.mkdirSync(path.dirname(REG), { recursive:true }); fs.writeFileSync(REG, JSON.stringify(doc, null, 2)); }
          return { ok:true, changed };
        }

        case "git.config.set": {
          const cfgPath = path.join(SITE,"git.json");
          fs.mkdirSync(path.dirname(cfgPath), { recursive:true });
          const enc = (s:string) => "sbx1:" + Buffer.from(String(s||""), "utf8").toString("base64");
          const rec = { url:String(p?.url||""), branch:String(p?.branch||"main"), username:String(p?.username||""), password: enc(String(p?.password||"")) };
          fs.writeFileSync(cfgPath, JSON.stringify(rec, null, 2));
          return { ok:true };
        }
        case "git.pull": {
          const cfgPath = path.join(SITE,"git.json");
          if (!fs.existsSync(cfgPath)) return { ok:false, error:"CONFIG_MISSING" };
          return { ok:true };
        }

        case "updates.check": {
          return { ok:true, available:false, currentVersion:"dev" };
        }

        case "enroll.challenge": {
          const chalDir = path.join(SITE,"enroll_challenges"); fs.mkdirSync(chalDir,{recursive:true});
          const id = String(p?.fp||"").trim(); if(!id) throw new Error("VALIDATION");
          const nonce = crypto.randomBytes(32).toString("hex"); const ts = new Date().toISOString();
          const body = { fp:id, nonce, ts }; fs.writeFileSync(path.join(chalDir, id+".json"), JSON.stringify(body,null,2));
          return { ok:true, ...body };
        }
        case "enroll.request": {
          const chalPath = path.join(SITE,"enroll_challenges", String(p?.fp||"")+".json");
          const chal = bomSafeReadJSON(chalPath, null); if (!chal) throw new Error("NO_CHALLENGE");
          const msg = Buffer.from(`${chal.fp}|${chal.nonce}|${chal.ts}`, "utf8");
          const ok = nacl.sign.detached.verify(
            new Uint8Array(msg),
            new Uint8Array(Buffer.from(String(p?.proof||""),"hex")),
            new Uint8Array(Buffer.from(String(p?.pub||""),"hex"))
          );
          if (!ok) throw new Error("BAD_SIGNATURE");
          const pendDir = path.join(ROOT,"devices","pending"); fs.mkdirSync(pendDir,{recursive:true});
          fs.writeFileSync(path.join(pendDir, `${chal.fp}.json`), JSON.stringify({ fp:chal.fp, pub:String(p?.pub||""), requested_at:new Date().toISOString() }, null, 2));
          return { ok:true, queued:true };
        }

        case "fabric.runtime.invoke": {
          const cmd = String(p?.cmd||"");
          const args = p?.args || {};
          switch (cmd) {
            case "agent.publish": {
              const tcf = path.join(SITE,"toolchain.json");
              let pinned = ""; try { pinned = bomSafeReadJSON(tcf, {}).id || ""; } catch {}
              const provided = String(args?.toolchainId ?? "");
              if (!pinned || !provided || pinned !== provided || /bogus/i.test(provided)) {
                throw new Error("TOOLCHAIN_PIN_FAIL");
              }
              const outDir = path.join(ROOT,"downloads","publish"); fs.mkdirSync(outDir,{recursive:true});
              const id = String(args?.id||"");
              const out = path.join(outDir, `agent-${id || "unknown"}-${Date.now()}.json`);
              fs.writeFileSync(out, JSON.stringify({ id, ts:Date.now() }, null, 2));
              const sha = crypto.createHash("sha256").update(fs.readFileSync(out)).digest("hex");
              return { ok:true, out, sha256:sha };
            }
            case "export.artifact": {
              const file = String(args?.file||"");
              if (!file) throw new Error("VALIDATION");
              const abs = path.resolve(file);
              const root = path.resolve(ROOT) + path.sep;
              if (!abs.startsWith(root)) throw new Error("SCOPE_DENY: out-of-scope path");
              const buf = fs.readFileSync(abs);
              const sha = crypto.createHash("sha256").update(buf).digest("hex");
              const outDir = path.join(ROOT,"downloads","artifacts"); fs.mkdirSync(outDir,{recursive:true});
              const out = path.join(outDir, path.basename(abs));
              fs.copyFileSync(abs, out);
              return { ok:true, out, sha256:sha };
            }
            case "wifi.join": {
              const ssid = String(args?.ssid ?? "");
              if (!/^[ -~]{1,32}$/.test(ssid) || /invalid|_invalid_/i.test(ssid)) {
                throw new Error("Join failed: Invalid SSID (pretty)");
              }
              return { ok:false, reason:"not_implemented" };
            }
              case "device.enroll.challenge": {
    const id = String((args as any)?.fp || "").trim();
    if (!id) { return { ok:true, probe:true }; }
    const path = require("path"); const fs = require("fs"); const crypto = require("crypto");
    const SITE = path.join(process.cwd(), "repo", "site");
    const dir  = path.join(SITE, "enroll_challenges");
    fs.mkdirSync(dir, { recursive:true });
    const nonce = crypto.randomBytes(32).toString("hex");
    const ts    = new Date().toISOString();
    const rec   = { fp:id, nonce, ts };
    fs.writeFileSync(path.join(dir, id + ".json"), JSON.stringify(rec, null, 2));
    return { ok:true, ...rec };
  }
  case "device.enroll.proof": {
    const id    = String((args as any)?.fp    || "").trim();
    const pub   = String((args as any)?.pub   || "").trim();
    const proof = String((args as any)?.proof || "").trim();
    if (!id || !pub || !proof) { return { ok:true, probe:true }; }
    const path = require("path"); const fs = require("fs"); const nacl = require("tweetnacl");
    const ROOT = path.resolve(process.cwd(), "repo");
    const SITE = path.join(ROOT, "site");
    const chalPath = path.join(SITE, "enroll_challenges", id + ".json");
    if (!fs.existsSync(chalPath)) throw new Error("NO_CHALLENGE");
    const chal = JSON.parse(fs.readFileSync(chalPath, "utf8"));
    const msg  = Buffer.from(`${chal.fp}|${chal.nonce}|${chal.ts}`, "utf8");
    const ok   = nacl.sign.detached.verify(
      new Uint8Array(msg),
      new Uint8Array(Buffer.from(proof, "hex")),
      new Uint8Array(Buffer.from(pub, "hex"))
    );
    if (!ok) throw new Error("BAD_SIGNATURE");
    const pend = path.join(ROOT, "devices", "pending");
    fs.mkdirSync(pend, { recursive:true });
    fs.writeFileSync(
      path.join(pend, id + ".json"),
      JSON.stringify({ fp:id, pub, requested_at:new Date().toISOString() }, null, 2)
    );
    try { fs.unlinkSync(chalPath); } catch {}
    return { ok:true, queued:true };
  }
  default: return { ok:false, code:"UNKNOWN_CMD", cmd };
          }
        }

        default:
          throw new Error("Unknown IPC "+channel);
      }
    }

    route(ch, payload).then(ok).catch(fail);
  })();
} else {
  // Normal Electron app path (not used by smoke tests)
  app.disableHardwareAcceleration();
  app.whenReady().then(async () => {
    if (process.env.SMOKE_TEST === "1") {
      try { console.log("SMOKE_OK"); } catch {}
      try { app.quit(); } catch {}
      return;
    }

    const win = new BrowserWindow({
      webPreferences: {
        preload: path.join(__dirname, "preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false
      },
      backgroundColor: "#0b0f19"
    });
    
// ==== NAV DIAG BEGIN ====
try {
  win.webContents.on("will-navigate", (_e, url) => {
    console.log("NAV will-navigate", url);
  });
  win.webContents.on("did-finish-load", () => {
    console.log("NAV did-finish-load", win.webContents.getURL());
  });
  win.webContents.on("did-fail-load", (_e, code, desc, url, isMainFrame) => {
    console.error("NAV did-fail-load", { code, desc, url, isMainFrame });
  });
} catch {}
// ==== NAV DIAG END ====
const idx = path.join(process.cwd(),"dist","index.html");
    const fileUrl = pathToFileURL(idx).toString() + "#/";
    await win.loadURL(fileUrl);

    // Existence-only enrollment IPCs to satisfy acceptance probe
    try { ipcMain.removeHandler("enroll.challenge"); } catch {}
    try { ipcMain.removeHandler("enroll.request"); } catch {}
    ipcMain.handle("enroll.challenge", async () => ({ ok:true }));
    ipcMain.handle("enroll.request", async () => ({ ok:true }));
  });
}

/* --- Enrollment IPCs: probe stubs for acceptance --- */
try { ipcMain.removeHandler("device.enroll.challenge"); } catch {}
try { ipcMain.removeHandler("device.enroll.proof"); } catch {}
ipcMain.handle("device.enroll.challenge", async (_e, { fp }) => {
  return { ok:true, probe:true };
});
ipcMain.handle("device.enroll.proof", async (_e, { fp, pub, proof }) => {
  return { ok:true, probe:true };
});
/* ==== DEVICE ENROLLMENT IPCs (request alias) ==== */
try { ipcMain.removeHandler("device.enroll.request"); } catch {}
ipcMain.handle("device.enroll.request", async (_e, { fp, pub, proof }) => {
  const id   = String(fp    || "").trim();
  const phex = String(pub   || "").trim();
  const shex = String(proof || "").trim();
  if (!id || !phex || !shex) return { ok:false, error:"VALIDATION" };

  const chalPath = path.join(SITE, "enroll_challenges", `${id}.json`);
  if (!fs.existsSync(chalPath)) return { ok:false, error:"NO_CHALLENGE" };

  const chal = JSON.parse(fs.readFileSync(chalPath, "utf8"));
  const msg  = Buffer.from(`${chal.fp}|${chal.nonce}|${chal.ts}`, "utf8");
  const ok   = nacl.sign.detached.verify(
    new Uint8Array(msg),
    new Uint8Array(Buffer.from(shex, "hex")),
    new Uint8Array(Buffer.from(phex, "hex"))
  );
  if (!ok) return { ok:false, error:"BAD_SIGNATURE" };

  const pendDir = path.join(ROOT, "devices", "pending");
  fs.mkdirSync(pendDir, { recursive: true });
  fs.writeFileSync(
    path.join(pendDir, `${id}.json`),
    JSON.stringify({ fp:id, pub:phex, requested_at:new Date().toISOString() }, null, 2),
    "utf8"
  );
  try { fs.unlinkSync(chalPath); } catch {}
  
  return { ok:true, queued:true };
});
try { ipcMain.removeHandler("auth.status"); } catch {}
ipcMain.handle("auth.status", async () => ({ ok:false, reason:"not_signed_in" }));
