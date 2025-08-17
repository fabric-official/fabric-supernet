
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePluginsStore } from '@/state/plugins.store';

export default function StoreInstall() {
  const nav = useNavigate();
  const { pluginId = '' } = useParams();
  const reg = usePluginsStore(s => s.registry);
  const install = usePluginsStore(s => s.install);
  const enable = usePluginsStore(s => s.enable);
  const [roles, setRoles] = useState<string[]>(['admin','dev']);
  const p = reg?.plugins.find(x => x.id === pluginId);
  if (!p) return <div className="p-4">Plugin not found.</div>;

  const onInstall = async () => {
    install(pluginId);
    enable(pluginId);
    nav('/marketplace');
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Install: {p.name}</h1>
      <div className="card">
        <div className="card-header">Permissions</div>
        <div className="card-body space-y-2">
          {(p.permissions||[]).map(x => <span key={x} className="badge mr-2">{x}</span>)}
        </div>
      </div>
      <div className="card">
        <div className="card-header">RBAC (who can use)</div>
        <div className="card-body space-y-3">
          <div className="flex gap-2 flex-wrap">
            {['owner','admin','dev','analyst','viewer'].map(r => (
              <label key={r} className="badge"><input type="checkbox" className="mr-2" checked={roles.includes(r)} onChange={e => {
                setRoles(s => e.target.checked ? Array.from(new Set([...s, r])) : s.filter(x => x !== r));
              }} /> {r}</label>
            ))}
          </div>
          <button onClick={onInstall} className="btn btn-primary">Install & Enable</button>
        </div>
      </div>
    </div>
  );
}
