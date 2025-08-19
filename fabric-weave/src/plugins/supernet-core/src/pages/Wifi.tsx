import React from "react";
import { fetchWifi } from "../index";

export default function Wifi() {
  const [nets, setNets] = React.useState<any[]>([]);
  const [err, setErr] = React.useState<string | null>(null);
  React.useEffect(()=>{ fetchWifi().then(setNets).catch(e=>setErr(e.message||String(e))); },[]);
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Wi-Fi</h1>
      {err && <div className="text-red-600">Error: {err}</div>}
      <ul className="space-y-2">
        {nets.map((w,i)=>(
          <li key={i} className="rounded-2xl border p-4 shadow-sm">
            <div className="font-medium">{w.id}</div>
            <div className="text-sm text-muted-foreground">{w.description || "—"}</div>
            <div className="mt-2 text-xs text-muted-foreground">v{w.version}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
