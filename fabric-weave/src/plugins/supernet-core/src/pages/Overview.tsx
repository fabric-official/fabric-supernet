import React from "react";
import { fetchAgents } from "../index";

export default function Overview() {
  const [agents, setAgents] = React.useState<any[]>([]);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchAgents().then(setAgents).catch(e=> setErr(e.message||String(e)));
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Supernet</h1>
      {err && <div className="text-red-600">Error: {err}</div>}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((a,i)=>(
          <div key={i} className="rounded-2xl border p-4 shadow-sm">
            <div className="font-medium">{a.id} <span className="text-xs text-muted-foreground">({a.category})</span></div>
            <div className="text-sm text-muted-foreground">{a.description || "—"}</div>
            <div className="mt-2 text-xs text-muted-foreground">v{a.version}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
