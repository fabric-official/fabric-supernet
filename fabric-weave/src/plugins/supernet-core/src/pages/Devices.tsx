import React from "react";
import { fetchDevices } from "../index";

export default function Devices() {
  const [items, setItems] = React.useState<any[]>([]);
  const [err, setErr] = React.useState<string | null>(null);
  React.useEffect(()=>{ fetchDevices().then(setItems).catch(e=>setErr(e.message||String(e))); },[]);
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Devices</h1>
      {err && <div className="text-red-600">Error: {err}</div>}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {items.map((d,i)=>(
          <div key={i} className="rounded-2xl border p-4 shadow-sm">
            <div className="font-medium">{d.id}</div>
            <div className="text-sm text-muted-foreground">{d.description || "—"}</div>
            <div className="mt-2 text-xs text-muted-foreground">v{d.version}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
