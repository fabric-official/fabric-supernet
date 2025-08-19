import React from "react";
import { fetchAgents, type SupernetAgent } from "../index";

export default function Modules() {
  const [items, setItems] = React.useState<SupernetAgent[]>([]);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const all = await fetchAgents();
        setItems(all.filter(a => String(a.category).toLowerCase() === "module"));
      } catch (e: any) {
        setErr(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Modules</h1>
        <div className="text-sm text-muted-foreground">
          {loading ? "Loading…" : `${items.length} module${items.length === 1 ? "" : "s"}`}
        </div>
      </div>

      {err && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">Error: {err}</div>}

      {items.length === 0 ? (
        <div className="text-sm text-muted-foreground">No modules found.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <div key={a.id} className="rounded-2xl border p-4 shadow-sm">
              <div className="font-medium">{a.id}</div>
              <div className="text-sm text-muted-foreground">{a.description || "—"}</div>
              <div className="mt-2 text-xs text-muted-foreground">v{a.version}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
