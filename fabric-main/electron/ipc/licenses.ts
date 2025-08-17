// electron/ipc/licenses.ts
// Production license IPC: list + import + activate (seat binding).
// NOTE: This module DOES NOT register 'runtime.invoke'. Main process calls activateSeat().

import { app, ipcMain } from "electron";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

type LicenseRecord = {
  lic_id: string;
  pkg: string;
  seats: number;
  devices: number;
  expires_at?: string;
  revoked?: boolean;
  expired?: boolean;
  issuer?: string;
  fingerprint?: string;
  issuer_kid?: string;
};

// ===== paths =====
const dataRoot = app.getPath("userData");
const dirLic   = path.join(dataRoot, "licenses");
const dirSeats = path.join(dataRoot, "seats");
const crlPath  = path.join(dataRoot, "crl.json");
const caDir    = path.join(dataRoot, "ca"); // optional EdDSA keys

// ===== env (dev HS256 only when enabled) =====
const DEV_ALLOW_HS256 = process.env.FAB_DEV_LICENSES === "1";
const HS256_DEV_KID   = process.env.HS256_DEV_KID || "";
const HS256_DEV_SECRET= process.env.HS256_DEV_SECRET || "";

// ===== util =====
function ensureDirs() {
  for (const d of [dirLic, dirSeats, caDir]) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  }
}

function b64url(buf: Buffer) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

// atomic write
async function atomicWrite(filePath: string, bytes: Buffer) {
  const tmp = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  await fsp.writeFile(tmp, bytes, { mode: 0o600 });
  try { const h = await fsp.open(tmp, "r"); await h.sync(); await h.close(); } catch {}
  await fsp.rename(tmp, filePath);
  try { await fsp.chmod(filePath, 0o600); } catch {}
}

// parse compact JWS string
function parseJWS(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("ERR_INVALID_FORMAT");
  const [h, p, s] = parts;
  const header  = JSON.parse(Buffer.from(h.replace(/-/g,"+").replace(/_/g,"/"), "base64").toString("utf8"));
  const payload = JSON.parse(Buffer.from(p.replace(/-/g,"+").replace(/_/g,"/"), "base64").toString("utf8"));
  const sig     = Buffer.from(s.replace(/-/g,"+").replace(/_/g,"/"), "base64");
  return { header, payload, signingInput: Buffer.from(`${h}.${p}`, "utf8"), sig };
}

// optional Ed25519 verification (production certs)
function verifyEdDSA(signingInput: Buffer, sig: Buffer, kid?: string): boolean {
  try {
    const files = fs.existsSync(caDir) ? fs.readdirSync(caDir).filter(f => f.endsWith(".pub")) : [];
    const candidates = kid ? files.filter(f => f.includes(kid)) : files;
    for (const f of (candidates.length ? candidates : files)) {
      try {
        const key = crypto.createPublicKey(fs.readFileSync(path.join(caDir, f)));
        if (crypto.verify(null, signingInput, key, sig)) return true;
      } catch {}
    }
  } catch {}
  return false;
}

// HS256 verification (DEV ONLY)
function verifyHS256(signingInput: Buffer, sig: Buffer, kid?: string): boolean {
  if (!DEV_ALLOW_HS256) return false;
  if (!HS256_DEV_SECRET || (kid && kid !== HS256_DEV_KID)) return false;
  const mac = crypto.createHmac("sha256", Buffer.from(HS256_DEV_SECRET, "utf8")).update(signingInput).digest();
  return mac.length === sig.length && crypto.timingSafeEqual(mac, sig);
}

function loadCRL(): { revoked: { lic_id: string }[] } {
  try { return JSON.parse(fs.readFileSync(crlPath, "utf8")); } catch { return { revoked: [] }; }
}

function normalizeRecord(payload: any, revokedSet: Set<string>): LicenseRecord {
  const now = Math.floor(Date.now()/1000);
  const exp = typeof payload.exp === "number" ? payload.exp : undefined;
  return {
    lic_id: String(payload.lic_id),
    pkg: String(payload.pkg),
    seats: Number(payload.seats || 0),
    devices: 0, // filled later
    issuer: payload.issuer,
    issuer_kid: payload.issuer_kid,
    expires_at: exp ? new Date(exp * 1000).toISOString() : undefined,
    expired: exp ? now > exp : false,
    revoked: revokedSet.has(String(payload.lic_id)),
    fingerprint: b64url(crypto.createHash("sha256").update(JSON.stringify(payload)).digest()),
  };
}

async function currentSeatCount(licId: string): Promise<number> {
  try {
    const files = await fsp.readdir(dirSeats);
    return files.filter(f => f.startsWith(licId + "_") && f.endsWith(".seat.json")).length;
  } catch { return 0; }
}

// ========== PUBLIC: seat activation (called from main.ts) ==========
export async function activateSeat(licId: string, pkg: string, deviceFp: string): Promise<{ ok: true }> {
  ensureDirs();

  const licFile = path.join(dirLic, `${licId}.fablic`);
  if (!fs.existsSync(licFile)) throw new Error("ERR_LICENSE_NOT_FOUND");

  const raw = fs.readFileSync(licFile, "utf8").trim();
  const { header, payload, signingInput, sig } = parseJWS(raw);
  const alg = header.alg;
  let ok = false;
  if (alg === "EdDSA") ok = verifyEdDSA(signingInput, sig, header.kid);
  else if (alg === "HS256") ok = verifyHS256(signingInput, sig, header.kid);
  if (!ok) throw new Error("ERR_SIGNATURE_INVALID");

  if (payload.pkg !== pkg) throw new Error("ERR_PKG_MISMATCH");

  const nowSec = Math.floor(Date.now()/1000);
  if (payload.exp && nowSec > payload.exp) throw new Error("ERR_LICENSE_EXPIRED");
  const revokedSet = new Set<string>((loadCRL().revoked || []).map((r:any)=>String(r.lic_id)));
  if (revokedSet.has(String(licId))) throw new Error("ERR_LICENSE_REVOKED");

  const seats = Number(payload.seats || 0);
  const bound = await currentSeatCount(licId);
  if (bound >= seats) throw new Error("ERR_SEATS_EXHAUSTED");

  // prevent duplicate seat for same license+device
  const seatPath = path.join(dirSeats, `${licId}_${deviceFp}.seat.json`);
  if (fs.existsSync(seatPath)) throw new Error("ERR_DUPLICATE_DEVICE_SEAT");

  const claim = {
    lic_id: licId,
    pkg,
    device_fp: deviceFp,
    bound_at: new Date().toISOString(),
    host_fp: os.hostname(),
    sig: b64url(crypto.createHash("sha256").update(`${licId}:${deviceFp}:${os.hostname()}`).digest()),
    v: 1,
  };
  await atomicWrite(seatPath, Buffer.from(JSON.stringify(claim) + "\n", "utf8"));
  return { ok: true };
}

// ========== IPC registration (list/import) ==========
export function registerLicenseIPC() {
  ensureDirs();

  // LIST
  ipcMain.handle("licenses.list", async () => {
    const revokedSet = new Set<string>((loadCRL().revoked || []).map((r:any)=>String(r.lic_id)));
    const out: LicenseRecord[] = [];
    const files = fs.existsSync(dirLic) ? fs.readdirSync(dirLic) : [];
    for (const name of files) {
      if (!name.endsWith(".fablic") && !name.endsWith(".jwt") && !name.endsWith(".json")) continue;
      try {
        const raw = fs.readFileSync(path.join(dirLic, name), "utf8").trim();
        const { header, payload, signingInput, sig } = parseJWS(raw);
        const alg = header.alg;
        let ok = false;
        if (alg === "EdDSA") ok = verifyEdDSA(signingInput, sig, header.kid);
        else if (alg === "HS256") ok = verifyHS256(signingInput, sig, header.kid);
        if (!ok) throw new Error("bad sig");
        const rec = normalizeRecord(payload, revokedSet);
        rec.devices = await currentSeatCount(rec.lic_id);
        out.push(rec);
      } catch (e) {
        console.error("[licenses.list] invalid license:", name, (e as Error).message);
      }
    }
    return out;
  });

  // IMPORT (upload)
  ipcMain.handle("licenses.import", async (_evt, bytes: Uint8Array) => {
    const raw = Buffer.from(bytes).toString("utf8").trim();
    const { header, payload, signingInput, sig } = parseJWS(raw);
    const alg = header.alg;
    let ok = false;
    if (alg === "EdDSA") ok = verifyEdDSA(signingInput, sig, header.kid);
    else if (alg === "HS256") ok = verifyHS256(signingInput, sig, header.kid);
    if (!ok) throw new Error("ERR_SIGNATURE_INVALID");

    if (!payload.lic_id || !payload.pkg || !payload.seats) throw new Error("ERR_INVALID_FIELDS");
    const nowSec = Math.floor(Date.now()/1000);
    if (payload.exp && nowSec > payload.exp) throw new Error("ERR_LICENSE_EXPIRED");
    const revokedSet = new Set<string>((loadCRL().revoked || []).map((r:any)=>String(r.lic_id)));
    if (revokedSet.has(String(payload.lic_id))) throw new Error("ERR_LICENSE_REVOKED");

    const filePath = path.join(dirLic, `${payload.lic_id}.fablic`);
    await atomicWrite(filePath, Buffer.from(raw + "\n", "utf8"));

    const rec = normalizeRecord(payload, revokedSet);
    rec.devices = await currentSeatCount(rec.lic_id);
    return { ok: true, lic: rec };
  });

  // NO OTHER HANDLERS HERE. (No 'runtime.invoke' here on purpose)
}



