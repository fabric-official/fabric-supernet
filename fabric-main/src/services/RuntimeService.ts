// src/services/RuntimeService.ts
// Runtime Service - CLI/Agent-VM RPC mapping with policy enforcement (PROD)
// - NO MOCKS for wifi.scan / wifi.join
// - Bridge-first (window.fab / window.fabric.invoke), then local REST
// - Strict timeouts, normalized outputs, clear errors

import { Device } from '@/types/plugin';

type WifiScanNetwork = {
  ssid: string;
  rssi?: number;
  signal?: number;     // 0..100
  quality?: number;    // 0..100 (alt field)
  security?: string;   // "Open" | "WPA2" | "WPA3" | vendor strings
  connected?: boolean;
  [k: string]: any;
};
type WifiScanResult = { networks: WifiScanNetwork[] };

type JoinResult = { success: boolean; error?: string };
type PolicyVerifyResult = { diagnostics: any[]; ok: boolean; error?: string };
type AttestVerifyResult = { verified: boolean; attestation?: any; error?: string };

export class RuntimeService {
  async invoke<T = any>(cmd: string, args?: Record<string, any>): Promise<T> {
    // eslint-disable-next-line no-console
    console.log(`Runtime invoke: ${cmd}`, args);

    if (cmd.startsWith('agent.') && args) {
      await this.enforceAgentPolicy(cmd, args);
    }

    switch (cmd) {
      case 'wifi.scan':
        return (await this.wifiScan()) as T;

      case 'wifi.join':
        return (await this.wifiJoin(args?.ssid, args?.psk)) as T;

      case 'device.list':
        return (await this.deviceList()) as T;

      case 'device.enroll':
        return (await this.deviceEnroll(args?.fp, args?.name, args?.role)) as T;

      case 'policy.verify':
        return (await this.policyVerify(args?.deviceFp)) as T;

      case 'attest.verify':
        return (await this.attestVerify(args?.artifactPath)) as T;

      case 'agent.start':
        return (await this.agentStart(args?.agentId, args?.deviceFp)) as T;

      case 'agent.stop':
        return (await this.agentStop(args?.agentId, args?.deviceFp)) as T;

      case 'agent.update':
        return (await this.agentUpdate(args?.agentId, args?.deviceFp)) as T;

      case 'license.activate':
        return (await this.licenseActivate(args?.licId, args?.pkg, args?.deviceFp)) as T;

      default:
        throw new Error(`Unknown runtime command: ${cmd}`);
    }
  }

  // ========== WIFI (REAL) ==========

  private async wifiScan(): Promise<WifiScanResult> {
    const g: any = globalThis as any;

    // 1) Native/Electron bridge
    if (g?.fab?.scanWifi) {
      const out: unknown = await this.withTimeout(g.fab.scanWifi(), 8000, 'wifi.scan timed out');
      return this.normalizeScanResult(out);
    }

    // 2) App bridge via window.fabric.invoke
    if (g?.fabric?.invoke) {
      const out: unknown = await this.withTimeout(g.fabric.invoke('wifi.scan'), 8000, 'wifi.scan timed out');
      return this.normalizeScanResult(out);
    }

    // 3) Local daemon REST
    const r = await this.withTimeout(
      fetch(`${this.getBaseUrl()}/wifi/scan`, { method: 'GET' }),
      8000,
      'wifi.scan timed out',
    );
    if (!r.ok) throw new Error(`wifi.scan HTTP ${r.status}`);
    const j: unknown = await r.json();
    return this.normalizeScanResult(j);
  }

  private async wifiJoin(ssid: string, psk?: string): Promise<JoinResult> {
    if (!ssid) return { success: false, error: 'ssid required' };
    const g: any = globalThis as any;

    // 1) Native/Electron bridge
    if (g?.fab?.joinWifi) {
      try {
        const resUnknown: unknown = await this.withTimeout(
          g.fab.joinWifi({ ssid, psk }),
          15000,
          'wifi.join timed out'
        );
        return this.ensureSuccess(resUnknown);
      } catch (e: any) {
        return { success: false, error: e?.message || 'join failed' };
      }
    }

    // 2) App bridge
    if (g?.fabric?.invoke) {
      try {
        const resUnknown: unknown = await this.withTimeout(
          g.fabric.invoke('wifi.join', { ssid, psk }),
          15000,
          'wifi.join timed out',
        );
        return this.ensureSuccess(resUnknown);
      } catch (e: any) {
        return { success: false, error: e?.message || 'join failed' };
      }
    }

    // 3) Local daemon REST
    try {
      const r = await this.withTimeout(
        fetch(`${this.getBaseUrl()}/wifi/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ssid, psk }),
        }),
        15000,
        'wifi.join timed out',
      );
      if (!r.ok) throw new Error(`wifi.join HTTP ${r.status}`);
      const j: unknown = await r.json();
      return this.ensureSuccess(j);
    } catch (e: any) {
      return { success: false, error: e?.message || 'join failed' };
    }
  }

  private normalizeScanResult(out: unknown): WifiScanResult {
    // Accept:
    // - { networks: [...] }
    // - [ ... ]
    // - { ssids: ["a","b"] }
    const anyOut: any = out as any;
    const list: any[] =
      Array.isArray(anyOut) ? anyOut
      : Array.isArray(anyOut?.networks) ? anyOut.networks
      : Array.isArray(anyOut?.ssids) ? anyOut.ssids.map((ssid: string) => ({ ssid }))
      : [];

    const networks: WifiScanNetwork[] = list
      .filter((n) => n && typeof n.ssid === 'string' && n.ssid.length > 0)
      .map((n) => ({
        ssid: n.ssid,
        rssi: typeof n.rssi === 'number' ? n.rssi : undefined,
        signal: this.toPercentSignal(n),
        quality: typeof n.quality === 'number' ? n.quality : undefined,
        security: this.toSecurity(n?.security),
        connected: !!n.connected,
        ...n,
      }))
      .sort((a, b) => (b.signal ?? 0) - (a.signal ?? 0));

    return { networks };
  }

  private toPercentSignal(n: any): number {
    if (typeof n.signal === 'number' && n.signal >= 0 && n.signal <= 100) return Math.round(n.signal);
    if (typeof n.quality === 'number' && n.quality >= 0 && n.quality <= 100) return Math.round(n.quality);
    if (typeof n.rssi === 'number') {
      // Map -90(dBm)=0% to -30(dBm)=100%
      const pct = ((n.rssi + 90) / 60) * 100;
      return Math.max(0, Math.min(100, Math.round(pct)));
    }
    return 0;
  }

  private toSecurity(sec: any): 'Open' | 'WPA2' | 'WPA3' {
    const s = (sec ?? '').toString().toUpperCase();
    if (!s || s === 'OPEN' || s === 'NONE') return 'Open';
    if (s.includes('WPA3')) return 'WPA3';
    return 'WPA2';
  }

  // ========== POLICY / DEVICES (REAL) ==========

  private async enforceAgentPolicy(cmd: string, args: Record<string, any>): Promise<void> {
    const agentPolicy = await this.getAgentPolicy(args.agentId || args.deviceFp);
    if (agentPolicy?.forkable === false || agentPolicy?.distribution === 'closed') {
      const restrictedOps = ['export', 'publish', 'fork'];
      if (restrictedOps.some((op) => cmd.includes(op))) {
        throw new Error(`Policy violation: ${cmd} blocked for closed/non-forkable agent`);
      }
    }
  }

  private async getAgentPolicy(agentOrDeviceId: string): Promise<any> {
    const g: any = globalThis as any;
    const id = agentOrDeviceId || '';

    // 1) App bridge
    if (g?.fabric?.invoke) {
      try {
        const res: unknown = await this.withTimeout(
          g.fabric.invoke('policy.get', { id }),
          8000,
          'policy.get timed out',
        );
        if (res && typeof res === 'object') return res as any;
      } catch { /* fall through */ }
    }

    // 2) Native/Electron bridge
    if (g?.fab?.getPolicy) {
      try {
        const res: unknown = await this.withTimeout(
          g.fab.getPolicy({ id }),
          8000,
          'policy.get (fab) timed out',
        );
        if (res && typeof res === 'object') return res as any;
      } catch { /* fall through */ }
    }

    // 3) Backend REST
    try {
      const r = await this.withTimeout(
        fetch(`${this.getBaseUrl()}/policy?id=${encodeURIComponent(id)}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        }),
        8000,
        'policy.get (REST) timed out',
      );
      if (!r.ok) throw new Error(`policy HTTP ${r.status}`);
      const j: unknown = await r.json();
      if (j && typeof j === 'object') return j as any;
    } catch { /* fall through */ }

    // Locked default
    return { forkable: false, distribution: 'closed', version: '1.0.0' };
  }

  private async deviceList(): Promise<Device[]> {
    const g: any = globalThis as any;

    // 1) App bridge
    if (g?.fabric?.invoke) {
      try {
        const res: unknown = await this.withTimeout(
          g.fabric.invoke('device.list'),
          8000,
          'device.list timed out',
        );
        return this.normalizeDevices(res);
      } catch { /* fall through */ }
    }

    // 2) Native/Electron bridge
    if (g?.fab?.listDevices) {
      try {
        const res: unknown = await this.withTimeout(
          g.fab.listDevices(),
          8000,
          'device.list (fab) timed out',
        );
        return this.normalizeDevices(res);
      } catch { /* fall through */ }
    }

    // 3) Backend REST
    try {
      const r = await this.withTimeout(
        fetch(`${this.getBaseUrl()}/devices`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        }),
        8000,
        'device.list (REST) timed out',
      );
      if (!r.ok) throw new Error(`devices HTTP ${r.status}`);
      const j: unknown = await r.json();
      return this.normalizeDevices(j);
    } catch { /* fall through */ }

    return [];
  }

  private normalizeDevices(input: unknown): Device[] {
    const anyIn: any = input as any;
    const arr: any[] = Array.isArray(anyIn)
      ? anyIn
      : Array.isArray(anyIn?.devices)
      ? anyIn.devices
      : [];

    return arr
      .map((d) => {
        const fp = d.fp || d.fingerprint || d.id || '';
        const name = d.name || d.hostname || d.deviceName || '';
        const role = d.role || d.type || 'edge';
        const online =
          typeof d.online === 'boolean'
            ? d.online
            : d.status
            ? String(d.status).toLowerCase() === 'online'
            : false;
        const lastHeartbeat =
          d.lastHeartbeat ||
          d.heartbeatAt ||
          d.updatedAt ||
          (d.last_seen ? new Date(d.last_seen).toISOString() : undefined) ||
          new Date().toISOString();

        const out: Device = { fp, name, role, online, lastHeartbeat };
        return out;
      })
      .filter((d) => !!d.fp);
  }

  private async deviceEnroll(fp: string, name: string, role: string): Promise<JoinResult> {
    const g: any = globalThis as any;

    // 1) App bridge
    if (g?.fabric?.invoke) {
      try {
        const resUnknown: unknown = await this.withTimeout(
          g.fabric.invoke('device.enroll', { fp, name, role }),
          8000,
          'device.enroll timed out',
        );
        return this.ensureSuccess(resUnknown);
      } catch (e: any) {
        return { success: false, error: e?.message || 'enroll failed' };
      }
    }

    // 2) Native/Electron bridge
    if (g?.fab?.enrollDevice) {
      try {
        const resUnknown: unknown = await this.withTimeout(
          g.fab.enrollDevice({ fp, name, role }),
          8000,
          'device.enroll (fab) timed out',
        );
        return this.ensureSuccess(resUnknown);
      } catch (e: any) {
        return { success: false, error: e?.message || 'enroll failed' };
      }
    }

    // 3) Backend REST
    try {
      const r = await this.withTimeout(
        fetch(`${this.getBaseUrl()}/devices/enroll`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fp, name, role }),
        }),
        8000,
        'device.enroll (REST) timed out',
      );
      if (!r.ok) throw new Error(`devices/enroll HTTP ${r.status}`);
      const j: unknown = await r.json();
      return this.ensureSuccess(j);
    } catch (e: any) {
      return { success: false, error: e?.message || 'enroll failed' };
    }
  }

  // ========== POLICY / ATTESTATION ==========

  private async policyVerify(deviceFp: string): Promise<PolicyVerifyResult> {
    const g: any = globalThis as any;

    // 1) Bridge
    if (g?.fabric?.invoke) {
      try {
        const resUnknown: unknown = await this.withTimeout(
          g.fabric.invoke('policy.verify', { deviceFp }),
          15000,
          'policy.verify timed out',
        );
        return this.ensurePolicyVerify(resUnknown);
      } catch (e: any) {
        return { diagnostics: [], ok: false, error: e?.message || 'verify failed' };
      }
    }

    // 2) Native
    if (g?.fab?.verifyPolicy) {
      try {
        const resUnknown: unknown = await this.withTimeout(
          g.fab.verifyPolicy({ deviceFp }),
          15000,
          'policy.verify (fab) timed out',
        );
        return this.ensurePolicyVerify(resUnknown);
      } catch (e: any) {
        return { diagnostics: [], ok: false, error: e?.message || 'verify failed' };
      }
    }

    // 3) REST
    try {
      const r = await this.withTimeout(
        fetch(`${this.getBaseUrl()}/policy/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceFp }),
        }),
        15000,
        'policy.verify (REST) timed out',
      );
      if (!r.ok) throw new Error(`policy/verify HTTP ${r.status}`);
      const j: unknown = await r.json();
      return this.ensurePolicyVerify(j);
    } catch (e: any) {
      return { diagnostics: [], ok: false, error: e?.message || 'verify failed' };
    }
  }

  private async attestVerify(artifactPath: string): Promise<AttestVerifyResult> {
    const g: any = globalThis as any;

    // 1) Bridge
    if (g?.fabric?.invoke) {
      try {
        const resUnknown: unknown = await this.withTimeout(
          g.fabric.invoke('attest.verify', { artifactPath }),
          15000,
          'attest.verify timed out',
        );
        return this.ensureAttest(resUnknown);
      } catch (e: any) {
        return { verified: false, error: e?.message || 'attest failed' };
      }
    }

    // 2) Native
    if (g?.fab?.verifyAttestation) {
      try {
        const resUnknown: unknown = await this.withTimeout(
          g.fab.verifyAttestation({ artifactPath }),
          15000,
          'attest.verify (fab) timed out',
        );
        return this.ensureAttest(resUnknown);
      } catch (e: any) {
        return { verified: false, error: e?.message || 'attest failed' };
      }
    }

    // 3) REST
    try {
      const r = await this.withTimeout(
        fetch(`${this.getBaseUrl()}/attest/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ artifactPath }),
        }),
        15000,
        'attest.verify (REST) timed out',
      );
      if (!r.ok) throw new Error(`attest/verify HTTP ${r.status}`);
      const j: unknown = await r.json();
      return this.ensureAttest(j);
    } catch (e: any) {
      return { verified: false, error: e?.message || 'attest failed' };
    }
  }

  // ========== AGENT / LICENSE ==========

  private async agentStart(agentId: string, deviceFp: string): Promise<JoinResult> {
    return this.agentAction('start', agentId, deviceFp);
  }
  private async agentStop(agentId: string, deviceFp: string): Promise<JoinResult> {
    return this.agentAction('stop', agentId, deviceFp);
  }
  private async agentUpdate(agentId: string, deviceFp: string): Promise<JoinResult> {
    return this.agentAction('update', agentId, deviceFp);
  }

  private async agentAction(
    action: 'start' | 'stop' | 'update',
    agentId: string,
    deviceFp: string,
  ): Promise<JoinResult> {
    const g: any = globalThis as any;

    // 1) Bridge
    if (g?.fabric?.invoke) {
      try {
        const resUnknown: unknown = await this.withTimeout(
          g.fabric.invoke(`agent.${action}`, { agentId, deviceFp }),
          10000,
          `agent.${action} timed out`,
        );
        return this.ensureSuccess(resUnknown);
      } catch (e: any) {
        return { success: false, error: e?.message || `agent.${action} failed` };
      }
    }

    // 2) Native
    const fabMethod =
      action === 'start' ? 'startAgent' : action === 'stop' ? 'stopAgent' : 'updateAgent';
    if (g?.fab?.[fabMethod]) {
      try {
        const resUnknown: unknown = await this.withTimeout(
          g.fab[fabMethod]({ agentId, deviceFp }),
          10000,
          `agent.${action} (fab) timed out`,
        );
        return this.ensureSuccess(resUnknown);
      } catch (e: any) {
        return { success: false, error: e?.message || `agent.${action} failed` };
      }
    }

    // 3) REST
    try {
      const r = await this.withTimeout(
        fetch(`${this.getBaseUrl()}/agent/${action}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agentId, deviceFp }),
        }),
        10000,
        `agent.${action} (REST) timed out`,
      );
      if (!r.ok) throw new Error(`agent/${action} HTTP ${r.status}`);
      const j: unknown = await r.json();
      return this.ensureSuccess(j);
    } catch (e: any) {
      return { success: false, error: e?.message || `agent.${action} failed` };
    }
  }

  private async licenseActivate(
    licId: string,
    pkg: string,
    deviceFp: string,
  ): Promise<JoinResult> {
    const g: any = globalThis as any;

    // 1) Bridge
    if (g?.fabric?.invoke) {
      try {
        const resUnknown: unknown = await this.withTimeout(
          g.fabric.invoke('license.activate', { licId, pkg, deviceFp }),
          15000,
          'license.activate timed out',
        );
        return this.ensureSuccess(resUnknown);
      } catch (e: any) {
        return { success: false, error: e?.message || 'license activation failed' };
      }
    }

    // 2) Native
    if (g?.fab?.activateLicense) {
      try {
        const resUnknown: unknown = await this.withTimeout(
          g.fab.activateLicense({ licId, pkg, deviceFp }),
          15000,
          'license.activate (fab) timed out',
        );
        return this.ensureSuccess(resUnknown);
      } catch (e: any) {
        return { success: false, error: e?.message || 'license activation failed' };
      }
    }

    // 3) REST
    try {
      const r = await this.withTimeout(
        fetch(`${this.getBaseUrl()}/license/activate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ licId, pkg, deviceFp }),
        }),
        15000,
        'license.activate (REST) timed out',
      );
      if (!r.ok) throw new Error(`license/activate HTTP ${r.status}`);
      const j: unknown = await r.json();
      return this.ensureSuccess(j);
    } catch (e: any) {
      return { success: false, error: e?.message || 'license activation failed' };
    }
  }

  // ========== HELPERS ==========

  private ensureSuccess(x: unknown): JoinResult {
    if (x && typeof (x as any).success === 'boolean') return x as JoinResult;
    return { success: false, error: 'operation failed' };
  }

  private ensurePolicyVerify(x: unknown): PolicyVerifyResult {
    if (x && typeof (x as any).ok === 'boolean' && Array.isArray((x as any).diagnostics)) {
      return x as PolicyVerifyResult;
    }
    const err = (x && ((x as any).error ?? (x as any).message)) || 'verify failed';
    return { diagnostics: [], ok: false, error: err };
  }

  private ensureAttest(x: unknown): AttestVerifyResult {
    if (x && typeof (x as any).verified === 'boolean') return x as AttestVerifyResult;
    const err = (x && ((x as any).error ?? (x as any).message)) || 'attest failed';
    return { verified: false, error: err };
  }

  private getBaseUrl(): string {
    const env = (import.meta as any)?.env?.VITE_RUNTIME_BASEURL;
    return typeof env === 'string' && env.length ? env : 'http://127.0.0.1:47615';
  }

  private withTimeout<T>(p: Promise<T>, ms: number, msg: string): Promise<T> {
    let t: any;
    const timeout = new Promise<never>((_, reject) => {
      t = setTimeout(() => reject(new Error(msg)), ms);
    });
    return Promise.race([p.finally(() => clearTimeout(t)), timeout]) as Promise<T>;
  }
}
