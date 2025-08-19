import { z } from 'zod';

export const config = {
  apiBase: (globalThis as any).__FABRIC__?.apiBase || '/api',
  wsBase: (globalThis as any).__FABRIC__?.wsBase || (globalThis.location ? ((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host) : 'ws://localhost:8080'),
  timeoutMs: 15000,
};

const abortableTimeout = (ms: number) => {
  const ctl = new AbortController();
  const id = setTimeout(() => ctl.abort('timeout'), ms);
  return { signal: ctl.signal, cancel: () => clearTimeout(id) };
};

export async function apiGet<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const t = abortableTimeout(config.timeoutMs);
  try {
    const res = await fetch(`${config.apiBase}${path}`, { signal: t.signal, credentials: 'include' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return schema.parse(json);
  } finally {
    t.cancel();
  }
}

export async function apiPost<T>(path: string, body: any, schema: z.ZodType<T>): Promise<T> {
  const t = abortableTimeout(config.timeoutMs);
  try {
    const res = await fetch(`${config.apiBase}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
      signal: t.signal
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return schema.parse(json);
  } finally {
    t.cancel();
  }
}

export function openSSE(path: string, onMsg: (data: any)=>void): EventSource | null {
  if (typeof EventSource === 'undefined') return null;
  const es = new EventSource(`${config.apiBase}${path}`, { withCredentials: true });
  es.onmessage = (e) => {
    try { onMsg(JSON.parse(e.data)); } catch {}
  };
  return es;
}

export function openWS(path: string, onMsg: (data:any)=>void, onStatus?: (s:'open'|'closed'|'error')=>void) {
  let ws: WebSocket | null = null;
  let retry = 0;
  let closed = false;

  const connect = () => {
    if (closed) return;
    try {
      const url = path.startsWith('ws') ? path : `${config.wsBase}${path}`;
      ws = new WebSocket(url);
      ws.onopen = () => { retry = 0; onStatus?.('open'); };
      ws.onclose = () => {
        onStatus?.('closed');
        if (!closed) {
          retry++;
          const delay = Math.min(30000, 500 * (2 ** Math.min(retry, 6)) + Math.random()*500);
          setTimeout(connect, delay);
        }
      };
      ws.onerror = () => onStatus?.('error');
      ws.onmessage = (e) => { try { onMsg(JSON.parse(e.data)); } catch {} };
    } catch {
      onStatus?.('error');
    }
  };
  connect();

  return {
    send: (obj:any) => {
      const s = JSON.stringify(obj);
      if (ws && ws.readyState === WebSocket.OPEN) ws.send(s);
    },
    close: () => { closed = true; try { ws?.close(); } catch {} }
  };
}
