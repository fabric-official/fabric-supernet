import * as React from 'react';
import { useBridge } from '../state/BridgeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X, PlugZap, Gauge } from 'lucide-react';

export function DeviceTable() {
  const { devices, approve, reject, assign, agents, setBudget } = useBridge();
  const [q, setQ] = React.useState('');

  const filtered = devices.filter(d => (d.name + ' ' + d.id + ' ' + (d.ip||'')).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search devicesâ€¦" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left">
            <tr className="border-b">
              <th className="p-2">Name</th>
              <th className="p-2">Kind</th>
              <th className="p-2">Status</th>
              <th className="p-2">IP</th>
              <th className="p-2">Energy</th>
              <th className="p-2">Agent</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.id} className="border-b">
                <td className="p-2 font-medium">{d.name}</td>
                <td className="p-2">{d.kind}</td>
                <td className="p-2">{d.status}</td>
                <td className="p-2">{d.ip || 'â€”'}</td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      defaultValue={d.energyBudget}
                      onBlur={(e)=>{
                        const v = parseInt(e.target.value || '0', 10);
                        if (!Number.isNaN(v) && v !== d.energyBudget) setBudget(d.id, v);
                      }}
                      className="w-24"
                    />
                    <Gauge className="w-4 h-4 text-muted-foreground" title="Set energy budget" />
                  </div>
                </td>
                <td className="p-2">
                  <select
                    defaultValue={d.agentAssigned || ''}
                    onChange={e => assign(d.id, e.target.value)}
                    className="px-2 py-1 border rounded-md"
                  >
                    <option value="">â€”</option>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={()=>approve(d.id)} title="Approve"><Check className="w-4 h-4" /></Button>
                    <Button size="sm" variant="destructive" onClick={()=>reject(d.id)} title="Reject"><X className="w-4 h-4" /></Button>
                    <Button size="sm" variant="secondary" title="Link">
                      <PlugZap className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <div className="p-6 text-sm text-muted-foreground">No devices.</div>}
      </div>
    </div>
  );
}
