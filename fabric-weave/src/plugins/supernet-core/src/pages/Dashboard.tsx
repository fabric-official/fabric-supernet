// src/pages/Dashboard.tsx
import React from "react";
import { Link } from "react-router-dom";
import { fetchAgents, type SupernetAgent } from "@/supernet"; // âœ… fixed

type Counts = {
  total: number;
  devices: number;
  wifi: number;
  drones: number;
  governor: number;
  other: number;
};

export default function Dashboard() {
  const [agents, setAgents] = React.useState<SupernetAgent[]>([]);
  const [counts, setCounts] = React.useState<Counts>({
    total: 0, devices: 0, wifi: 0, drones: 0, governor: 0, other: 0,
  });
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchAgents();
        if (!mounted) return;
        setAgents(data);
        const c: Counts = {
          total: data.length,
          devices: data.filter(a => a.category === "devices").length,
          wifi: data.filter(a => a.category === "wifi").length,
          drones: data.filter(a => a.category === "drones").length,
          governor: data.filter(a => a.category === "governor").length,
          other: data.filter(a => !["devices","wifi","drones","governor","storage","treasury","module"].includes(String(a.category).toLowerCase())).length,
        };
        setCounts(c);
      } catch (e: any) {
        setErr(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const group = (cat: SupernetAgent["category"]) =>
    agents.filter(a => a.category === cat);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Supernet Dashboard</h1>
        <div className="text-sm text-muted-foreground">
          {loading ? "Loadingâ€¦" : `${counts.total} agent${counts.total === 1 ? "" : "s"}`}
        </div>
      </div>

      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          Error: {err}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Devices"  value={counts.devices}  to="/supernet/devices" />
        <StatCard label="Wi-Fi"    value={counts.wifi}     to="/supernet/wifi" />
        <StatCard label="Drones"   value={counts.drones}   to="/supernet/drones" />
        <StatCard label="Governor" value={counts.governor} to="/supernet/governor" />
        <StatCard label="Other"    value={counts.other}    />
      </div>

      {/* Lists */}
      <Section title="Devices"   to="/supernet/devices"   items={group("devices")} />
      <Section title="Wi-Fi"     to="/supernet/wifi"      items={group("wifi")} />
      <Section title="Drones"    to="/supernet/drones"    items={group("drones")} />
      <Section title="Governor"  to="/supernet/governor"  items={group("governor")} />
      <Section title="Other"     items={group("other")} />
    </div>
  );
}

function StatCard({ label, value, to }: { label: string; value: number; to?: string }) {
  const body = (
    <div className="rounded-2xl border p-4 shadow-sm hover:shadow transition">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

function Section({
  title, items, to,
}: { title: string; items: SupernetAgent[]; to?: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">{title}</h2>
        {to && <Link to={to} className="text-sm text-blue-600 hover:underline">Open</Link>}
      </div>
      {items.length === 0 ? (
        <div className="text-sm text-muted-foreground">No entries.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <div key={a.id} className="rounded-2xl border p-4 shadow-sm">
              <div className="font-medium">{a.id}</div>
              <div className="text-sm text-muted-foreground">{a.description || "â€”"}</div>
              <div className="mt-2 text-xs text-muted-foreground">v{a.version}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


