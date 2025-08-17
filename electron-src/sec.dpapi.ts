import * as os from "os";
import * as crypto from "crypto";
import { spawnSync } from "child_process";

/** ---- helpers ---- */
const toBuf = (u: Uint8Array | Buffer): Buffer =>
  Buffer.isBuffer(u) ? u : Buffer.from(u.buffer, u.byteOffset, u.byteLength);

/** Windows DPAPI via PowerShell (no native build) */
function dpapiProtect(data: Buffer): Buffer {
  const b64 = data.toString("base64");
  const ps = [
    "-NoLogo","-NonInteractive","-Command",
    "$in=[System.Convert]::FromBase64String('" + b64 + "');" +
    "$ss=ConvertTo-SecureString ([System.Text.Encoding]::UTF8.GetString($in)) -AsPlainText -Force;" +
    "$enc=$ss | ConvertFrom-SecureString;" +
    "[Console]::Out.Write($enc)"
  ];
  const res = spawnSync("powershell.exe", ps, { encoding: "utf8" });
  if (res.status !== 0 || !res.stdout) throw new Error("DPAPI protect failed: " + (res.stderr || res.status));
  return Buffer.from(res.stdout, "utf8");
}

function dpapiUnprotect(encText: string): Buffer {
  const ps = [
    "-NoLogo","-NonInteractive","-Command",
    "$enc='" + encText.replace(/'/g, "''") + "';" +
    "$ss=ConvertTo-SecureString $enc;" +
    "$bPtr=[System.Runtime.InteropServices.Marshal]::SecureStringToGlobalAllocUnicode($ss);" +
    "try{ $plain=[System.Runtime.InteropServices.Marshal]::PtrToStringUni($bPtr) } finally { [System.Runtime.InteropServices.Marshal]::ZeroFreeGlobalAllocUnicode($bPtr) };" +
    "[Console]::Out.Write($plain)"
  ];
  const res = spawnSync("powershell.exe", ps, { encoding: "utf8" });
  if (res.status !== 0) throw new Error("DPAPI unprotect failed: " + (res.stderr || res.status));
  return Buffer.from(res.stdout || "", "utf8");
}

/** ---- public API ---- */
export function winDPAPI_encrypt(buf: Buffer): Buffer {
  if (os.platform() === "win32") return dpapiProtect(buf);

  // AES-256-GCM fallback
  const key = crypto.createHash("sha256").update(os.hostname()).digest(); // Buffer (32)
  const iv  = crypto.randomBytes(12); // Buffer (12)

  // @ts-ignore Node accepts Buffer as CipherKey, typings can be finicky across versions
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  // @ts-ignore update(Buffer) is valid; overload resolution can mis-pick in some TS/Node combos
  const enc = Buffer.concat([ cipher.update(buf), cipher.final() ]);

  // @ts-ignore getAuthTag returns Buffer; cast noise is TS-only
  const tag = cipher.getAuthTag();

  return Buffer.concat([ iv, tag, enc ]);
}

export function winDPAPI_decrypt(blob: Buffer): Buffer {
  if (os.platform() === "win32") {
    return dpapiUnprotect(blob.toString("utf8"));
  }

  if (blob.length < 12 + 16) throw new Error("bad blob");
  const iv  = blob.subarray(0, 12);
  const tag = blob.subarray(12, 28);
  const enc = blob.subarray(28);

  const key = crypto.createHash("sha256").update(os.hostname()).digest();

  // @ts-ignore Buffer is fine for key/iv at runtime
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  // @ts-ignore Buffer is acceptable for auth tag
  decipher.setAuthTag(tag);

  // @ts-ignore update(Buffer) is valid
  const dec = Buffer.concat([ decipher.update(enc), decipher.final() ]);
  return dec;
}
