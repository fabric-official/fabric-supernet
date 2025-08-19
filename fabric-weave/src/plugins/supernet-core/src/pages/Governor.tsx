import React from "react";
import { fetchPolicies } from "../index";

export default function Governor() {
  const [policies, setPolicies] = React.useState<any[]>([]);
  const [err, setErr] = React.useState<string | null>(null);
  React.useEffect(()=>{ fetchPolicies().then(setPolicies).catch(e=>setErr(e.message||String(e))); },[]);
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Governor</h1>
      {err && <div className="text-red-600">Error: {err}</div>}
      <ul className="space-y-2">
        {policies.map((p,i)=>(
          <li key={i} className="rounded-2xl border p-4 shadow-sm">
            <div className="font-medium">{p.agent || "Policy"}</div>
            <div className="text-xs text-muted-foreground break-all">{JSON.stringify(p)}</div>
          </li>
        ))}
        {policies.length===0 && <li className="text-muted-foreground">No policies reported.</li>}
      </ul>
    </div>
  );
}
