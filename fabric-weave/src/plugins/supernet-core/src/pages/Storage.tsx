import React from "react";
import { fetchStorage } from "../index";

export default function Storage() {
  const [rows, setRows] = React.useState<any[]>([]);
  const [err, setErr] = React.useState<string | null>(null);
  React.useEffect(()=>{ fetchStorage().then(setRows).catch(e=>setErr(e.message||String(e))); },[]);
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Network Storage</h1>
      {err && <div className="text-red-600">Error: {err}</div>}
      <table className="w-full text-sm">
        <thead><tr className="text-left text-muted-foreground"><th className="py-2">Source</th><th>Info</th></tr></thead>
        <tbody>
        {rows.map((m,i)=>(
          <tr key={i} className="border-t">
            <td className="py-2">{m.type || m.kind || "—"}</td>
            <td className="text-muted-foreground break-all">{JSON.stringify(m)}</td>
          </tr>
        ))}
        {rows.length===0 && <tr><td className="py-2">—</td><td className="text-muted-foreground">No mounts reported.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
