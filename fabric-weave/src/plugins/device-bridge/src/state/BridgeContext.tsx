import * as React from 'react';
import { z } from 'zod';
import { apiGet, apiPost, openSSE, openWS } from '../api/client';

export const Device = z.object({
  id: z.string(),
  kind: z.enum(['android','ios','router','linux','windows','mac','iot']).default('iot'),
  name: z.string(),
  status: z.enum(['pending','approved','rejected','online','offline']).default('pending'),
  lastSeen: z.string().optional(),
  ip: z.string().optional(),
  energyBudget: z.number().int().nonnegative().default(0),
  agentAssigned: z.string().optional(),
});
export type Device = z.infer<typeof Device>;

export const Agent = z.object({
  id: z.string(),
  name: z.string(),
  repo: z.string(),
  summary: z.string().default(''),
});
export type Agent = z.infer<typeof Agent>;

export const TelemetryEvent = z.object({
  id: z.string(),
  deviceId: z.string(),
  at: z.string(),
  level: z.enum(['info','warn','error']).default('info'),
  message: z.string(),
});
export type TelemetryEvent = z.infer<typeof TelemetryEvent>;

export type BridgeState = {
  devices: Device[];
  agents: Agent[];
  telemetry: TelemetryEvent[];
  pairPayload: string | null;
  reload(): Promise<void>;
  approve(id: string): Promise<void>;
  reject(id: string): Promise<void>;
  assign(id: string, agentId: string): Promise<void>;
  setBudget(id: string, energyBudget: number): Promise<void>;
  refreshPairPayload(kind?: string): Promise<void>;
};

const Ctx = React.createContext<BridgeState | null>(null);

export function BridgeProvider({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = React.useState<Device[]>([]);
  const [agents, setAgents] = React.useState<Agent[]>([]);
  const [telemetry, setTelemetry] = React.useState<TelemetryEvent[]>([]);
  const [pairPayload, setPairPayload] = React.useState<string | null>(null);

  const reload = React.useCallback(async () => {
    try {
      const [d, a] = await Promise.all([
        apiGet('/bridge/devices', z.array(Device)),
        apiGet('/bridge/agents', z.array(Agent)),
      ]);
      setDevices(d); setAgents(a);
    } catch {}
  }, []);

  React.useEffect(() => { reload(); }, [reload]);

  // Telemetry stream via SSE
  React.useEffect(() => {
    const es = openSSE('/bridge/telemetry/stream', (data:any) => {
      const ev = TelemetryEvent.safeParse(data);
      if (ev.success) setTelemetry(prev => [...prev, ev.data].slice(-1000));
    });
    // Device status via WS
    const ws = openWS('/api/bridge/events', (data:any) => {
      if (data?.type === 'device_status' && data.device) {
        const dv = Device.safeParse(data.device);
        if (dv.success) {
          setDevices(prev => {
            const idx = prev.findIndex(x => x.id === dv.data.id);
            if (idx >= 0) {
              const copy = prev.slice(); copy[idx] = dv.data; return copy;
            }
            return [dv.data, ...prev];
          });
        }
      }
    });
    return () => { try { (ws as any)?.close?.(); } catch {}; try { es?.close(); } catch {} };
  }, []);

  const approve = React.useCallback(async (id: string) => {
    await apiPost(`/bridge/devices/${id}/approve`, {}, z.object({ ok: z.boolean() }));
    await reload();
  }, [reload]);

  const reject = React.useCallback(async (id: string) => {
    await apiPost(`/bridge/devices/${id}/reject`, {}, z.object({ ok: z.boolean() }));
    await reload();
  }, [reload]);

  const assign = React.useCallback(async (id: string, agentId: string) => {
    await apiPost(`/bridge/devices/${id}/assign-agent`, { agentId }, z.object({ ok: z.boolean() }));
    await reload();
  }, [reload]);

  const setBudget = React.useCallback(async (id: string, energyBudget: number) => {
    await apiPost(`/bridge/devices/${id}/energy`, { energyBudget }, z.object({ ok: z.boolean() }));
    await reload();
  }, [reload]);

  const refreshPairPayload = React.useCallback(async (kind?: string) => {
    const out = await apiGet(`/bridge/pair${kind ? ('?kind=' + encodeURIComponent(kind)) : ''}`, z.object({ payload: z.string() }));
    setPairPayload(out.payload);
  }, []);

  const value: BridgeState = { devices, agents, telemetry, pairPayload, reload, approve, reject, assign, setBudget, refreshPairPayload };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBridge() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error('BridgeProvider missing');
  return ctx;
}
