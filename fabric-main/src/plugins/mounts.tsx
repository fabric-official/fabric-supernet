
import React from 'react';
import { PluginHost } from './sandbox';
import type { TRegistryPlugin } from './schema';
import { usePluginsStore } from '@/state/plugins.store';

type MountProps = {
  slot: 'overview:kpis'|'agent:tabs'|'forktree:cards'|'context:panel';
  agentId?: string;
  node?: any;
};

export function MountPoint({ slot, agentId, node }: MountProps) {
  const installed = usePluginsStore(s => s.installed);
  const enabled = usePluginsStore(s => s.enabled);
  const reg = usePluginsStore(s => s.registry);

  if (!reg) return null;

  const list = reg.plugins.filter(p => installed.includes(p.id) && enabled.includes(p.id));

  if (!list.length) return null;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {list.map(p => (
        <div key={p.id} className="card">
          <div className="card-header">{p.name}</div>
          <div className="card-body" style={{ height: 360 }}>
            <PluginHost plugin={p} context={{ agentId, node, slot }} />
          </div>
        </div>
      ))}
    </div>
  );
}
