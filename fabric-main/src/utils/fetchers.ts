
import { z } from 'zod';

export class FetchError extends Error {
  status?: number;
  url?: string;
  constructor(msg: string, status?: number, url?: string) {
    super(msg); this.status = status; this.url = url;
  }
}

const DEFAULT_TIMEOUT = 15000;

export async function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}, timeout = DEFAULT_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(input, { ...init, signal: controller.signal, cache: 'no-store', referrerPolicy: 'no-referrer' });
    if (!res.ok) throw new FetchError(`HTTP ${res.status} for ${typeof input === 'string' ? input : (input as Request).url}`, res.status);
    return res;
  } finally {
    clearTimeout(id);
  }
}

export async function getJSON<T>(url: string, schema: z.ZodType<T>): Promise<T> {
  const r = await fetchWithTimeout(url, { headers: { 'Accept': 'application/json' } });
  const data = await r.json();
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    console.error(parsed.error.format());
    throw new Error(`Schema validation failed for ${url}`);
  }
  return parsed.data;
}

export async function getText(url: string): Promise<string> {
  const r = await fetchWithTimeout(url, { headers: { 'Accept': 'text/plain,*/*' } });
  return r.text();
}

export async function getArrayBuffer(url: string): Promise<ArrayBuffer> {
  const r = await fetchWithTimeout(url, { headers: { 'Accept': '*/*' } });
  return r.arrayBuffer();
}

export async function sha256(buf: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', buf);
  const bytes = Array.from(new Uint8Array(hash));
  return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}
