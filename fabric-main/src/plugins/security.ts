
import { getArrayBuffer } from '@/utils/fetchers';

/** Decode base64 (std or url-safe) to Uint8Array */
export function b64decode(b64: string): Uint8Array {
  let s = b64.replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4;
  if (pad) s += '='.repeat(4 - pad);
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Import an Ed25519 public key (raw 32-byte or SPKI DER base64) */
export async function importEd25519PublicKey(b64: string): Promise<CryptoKey> {
  if (!b64) throw new Error('Missing Ed25519 public key');
  const bytes = b64decode(b64);
  if (bytes.byteLength === 32) {
    return crypto.subtle.importKey('raw', bytes, { name: 'Ed25519' }, false, ['verify']);
  }
  return crypto.subtle.importKey('spki', bytes, { name: 'Ed25519' }, false, ['verify']);
}

/** Verify detached Ed25519 signature over arbitrary URL content */
export async function verifyDetachedEd25519(url: string, sigUrl: string, pubB64: string): Promise<boolean> {
  const [buf, sigBuf, pub] = await Promise.all([
    getArrayBuffer(url),
    getArrayBuffer(sigUrl),
    importEd25519PublicKey(pubB64)
  ]);
  return crypto.subtle.verify('Ed25519', pub, sigBuf, buf);
}
