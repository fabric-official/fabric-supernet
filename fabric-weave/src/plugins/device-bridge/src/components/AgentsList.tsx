import * as React from 'react';
import { useBridge } from '../state/BridgeContext';
import { ExternalLink } from 'lucide-react';

export function AgentsList() {
  const { agents } = useBridge();
  return (
    <div className="p-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {agents.map(a => (
        <div key={a.id} className="p-4 border rounded-xl space-y-2">
          <div className="font-semibold">{a.name}</div>
          <div className="text-xs text-muted-foreground">{a.id}</div>
          <p className="text-sm">{a.summary}</p>
          <a href={a.repo} target="_blank" rel="noreferrer" className="text-xs hover:underline inline-flex items-center gap-1">repo <ExternalLink className="w-3 h-3"/></a>
        </div>
      ))}
      {!agents.length && <div className="p-6 text-sm text-muted-foreground">No agents available.</div>}
    </div>
  );
}
