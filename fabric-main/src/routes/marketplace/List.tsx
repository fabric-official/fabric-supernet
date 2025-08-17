
import React, { useEffect, useState } from 'react';
import { fetchRegistry } from '@/plugins/registry';
import { usePluginsStore } from '@/state/plugins.store';
import { Link } from 'react-router-dom';

export default function StoreList() {
  const setRegistry = usePluginsStore(s => s.setRegistry);
  const registry = usePluginsStore(s => s.registry);
  const [err, setErr] = useState<string>('');
  useEffect(() => {
    (async () => {
      try {
        const r = await fetchRegistry();
        setRegistry(r);
      } catch (e: any) {
        setErr(String(e?.message || e));
      }
    })();
  }, [setRegistry]);

  if (err) return <div className="p-4 text-red-400">Registry error: {err}</div>;
  if (!registry) return <div className="p-4">Loading registry…</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">App Store (Open-Source Plugins)</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {registry.plugins.map(p => (
          <div key={p.id} className="card">
            <div className="card-header">{p.name}</div>
            <div className="card-body space-y-3">
              <p className="text-sm text-slate-400">{p.description || '—'}</p>
              <div className="flex gap-2 flex-wrap">
                {(p.categories || []).map(c => <span key={c} className="badge">{c}</span>)}
              </div>
              <Link to={`/marketplace/${encodeURIComponent(p.id)}`} className="btn btn-primary">View</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
