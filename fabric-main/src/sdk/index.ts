
import { CapabilityMap, hasCap } from '@/plugins/capabilities';

export type PipelineMode = 'local' | 'remote';

async function execLocal(cmd: string): Promise<any> {
  // Implement your desktop bridge to run `fab` locally (Electron IPC or native host)
  throw new Error('execLocal not implemented');
}

async function requestApproval(payload: any): Promise<void> {
  const res = await fetch('/v1/approvals/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Approval request failed');
}

export function ShellSDK(caps: CapabilityMap) {
  return {
    async pipelines_build(mode: PipelineMode, payload: any) {
      if (!hasCap(caps, 'pipelines:build')) throw new Error('Capability denied: pipelines:build');
      if (mode === 'local') return execLocal('fab build');
      const r = await fetch('/v1/builds', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)});
      if (!r.ok) throw new Error('Remote build failed');
      return r.json();
    },
    async pipelines_sign(buildId: string, mode: PipelineMode, params: any) {
      if (!hasCap(caps, 'pipelines:sign')) throw new Error('Capability denied: pipelines:sign');
      if (mode === 'local') return execLocal('fab sign');
      await requestApproval({ type: 'sign', buildId });
      const r = await fetch(`/v1/builds/${buildId}/sign`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(params)});
      if (!r.ok) throw new Error('Remote sign failed');
      return r.json();
    },
    async pipelines_publish(buildId: string, mode: PipelineMode, params: any) {
      if (!hasCap(caps, 'pipelines:publish')) throw new Error('Capability denied: pipelines:publish');
      if (mode === 'local') return execLocal(`fab publish --chain ${params.chain}`);
      await requestApproval({ type: 'publish', buildId, params });
      const r = await fetch(`/v1/builds/${buildId}/publish`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(params)});
      if (!r.ok) throw new Error('Remote publish failed');
      return r.json();
    },
    async pipelines_run(agentId: string, params: any) {
      if (!hasCap(caps, 'pipelines:run')) throw new Error('Capability denied: pipelines:run');
      const r = await fetch(`/v1/agents/${agentId}/runs`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(params)});
      if (!r.ok) throw new Error('Run failed');
      return r.json();
    },
  };
}
