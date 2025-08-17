
import { RegistryIndex, PluginManifest, type TRegistryIndex, type TRegistryPlugin } from './schema';
import { getArrayBuffer } from '@/utils/fetchers';
import { importEd25519PublicKey } from './security';

/** Env */
const REGISTRY_URL = import.meta.env.VITE_APPSTORE_REGISTRY_URL;
const REGISTRY_SIG_URL = import.meta.env.VITE_APPSTORE_REGISTRY_SIG_URL;
const REGISTRY_PUBKEY = import.meta.env.VITE_APPSTORE_PUBKEY_ED25519;
const DEFAULT_PLUGIN_PUBKEY = import.meta.env.VITE_PLUGIN_DEFAULT_PUBKEY_ED25519;

/** Verify registry signature, return parsed index */
export async function fetchRegistry(): Promise<TRegistryIndex> {
  if (!REGISTRY_URL || !REGISTRY_SIG_URL || !REGISTRY_PUBKEY) {
    throw new Error('AppStore env not set (VITE_APPSTORE_REGISTRY_URL, _SIG_URL, _PUBKEY_ED25519)');
  }
  const [indexRes, sigBuf, pubKey] = await Promise.all([
    fetch(REGISTRY_URL, { cache: 'no-store' }),
    getArrayBuffer(REGISTRY_SIG_URL),
    importEd25519PublicKey(REGISTRY_PUBKEY)
  ]);
  if (!indexRes.ok) throw new Error(`Failed to fetch registry: ${indexRes.status}`);
  const indexBuf = await indexRes.arrayBuffer();
  const ok = await crypto.subtle.verify('Ed25519', pubKey, sigBuf, indexBuf);
  if (!ok) throw new Error('Registry signature verification failed');
  const indexJson = JSON.parse(new TextDecoder().decode(indexBuf));
  const parsed = RegistryIndex.safeParse(indexJson);
  if (!parsed.success) {
    console.error(parsed.error.format());
    throw new Error('Registry schema invalid');
  }
  return parsed.data;
}

/** Fetch and validate a plugin's manifest */
export async function fetchManifest(manifestUrl: string) {
  const res = await fetch(manifestUrl, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch manifest: ${res.status}`);
  const json = await res.json();
  const parsed = PluginManifest.safeParse(json);
  if (!parsed.success) {
    console.error(parsed.error.format());
    throw new Error('Plugin manifest schema invalid');
  }
  return parsed.data;
}

/** Verify a plugin bundle with sig (optionally per-plugin pubkey) */
export async function verifyBundle(url: string, sigUrl?: string, pubkeyB64?: string): Promise<boolean> {
  if (!sigUrl) return false;
  const [buf, sigBuf] = await Promise.all([
    fetch(url, { cache: 'no-store' }).then(r => r.arrayBuffer()),
    getArrayBuffer(sigUrl)
  ]);
  const key = await importEd25519PublicKey(pubkeyB64 || DEFAULT_PLUGIN_PUBKEY || '');
  return crypto.subtle.verify('Ed25519', key, sigBuf, buf);
}

/** Choose concrete bundle URL for a plugin (resolves latest + constraints) */
export function resolveBundle(p: TRegistryPlugin) {
  const latest = p.versions.find(v => v.v === p.latest) || p.versions[0];
  return latest;
}
