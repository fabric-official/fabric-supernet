import * as React from 'react';
import { useForge } from '../state/ForgeContext';
import { AgentCard } from '../components/AgentCard';

export default function AgentsPage() {
  const { agents } = useForge();
  return (
    <div className="grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-3">
      {agents.map(a => <AgentCard key={a.id} a={a} />)}
      {!agents.length && <div className="p-6 text-sm text-muted-foreground">No agents showcased yet.</div>}
    </div>
  );
}
