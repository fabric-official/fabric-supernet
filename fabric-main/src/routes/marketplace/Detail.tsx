
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePluginsStore } from '@/state/plugins.store';

export default function StoreDetail() {
  const { pluginId = '' } = useParams();
  const reg = usePluginsStore(s => s.registry);
  const p = reg?.plugins.find(x => x.id === pluginId);
  if (!p) return <div className="p-4">Plugin not found.</div>;
  const latest = p.versions.find(v => v.v === p.latest) || p.versions[0];
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{p.name}</h1>
        <Link to={`/marketplace/${encodeURIComponent(p.id)}/install`} className="btn btn-primary">Install</Link>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card md:col-span-2">
          <div className="card-header">Overview</div>
          <div className="card-body space-y-2">
            <div>Publisher: <span className="badge">{p.publisher}</span></div>
            <div>Latest: <span className="badge">{p.latest}</span></div>
            <div>Permissions: {(p.permissions||[]).map(x => <span key={x} className="badge mr-2">{x}</span>)}</div>
            <div>SBOM: {latest.sbom ? <a className="underline" href={latest.sbom} target="_blank" rel="noreferrer">view</a> : '—'}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">Security</div>
          <div className="card-body text-sm space-y-2">
            <div>Signature: {latest.sig ? 'present' : 'missing'}</div>
            <div>SHA256: {latest.sha256 || '—'}</div>
            <div>Min Shell: {latest.minShell || '—'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
