
export type Capability =
  | 'agents:read' | 'runs:read' | 'royalties:read' | 'policies:read' | 'nodes:read' | 'alerts:read'
  | 'approvals:request' | 'pipelines:build' | 'pipelines:sign' | 'pipelines:publish' | 'pipelines:run'
  | 'webhooks:subscribe' | 'kpis:write';

export type CapabilityMap = Record<Capability, boolean>;

export function hasCap(caps: CapabilityMap, cap: Capability): boolean {
  return !!caps[cap];
}

export function deriveCaps(permissions: string[]): CapabilityMap {
  const map: CapabilityMap = {
    'agents:read': false, 'runs:read': false, 'royalties:read': false, 'policies:read': false, 'nodes:read': false, 'alerts:read': false,
    'approvals:request': false, 'pipelines:build': false, 'pipelines:sign': false, 'pipelines:publish': false, 'pipelines:run': false,
    'webhooks:subscribe': false, 'kpis:write': false
  };
  for (const p of permissions) {
    if (p in map) (map as any)[p] = true;
  }
  return map;
}
