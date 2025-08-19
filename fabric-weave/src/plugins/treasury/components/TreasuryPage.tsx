import React, { useEffect, useState } from "react";
import { http } from "@/lib/http";

type Metric = { name: string; value: number; unit?: string };

export const TreasuryPage: React.FC = () => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await http.get<any>("/api/treasury/metrics");
        const items: Metric[] = Array.isArray(data) ? data : (data.metrics ?? []);
        setMetrics(items);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load metrics");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h1>Treasury</h1>
      {loading && <p>Loadingâ€¦</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {!loading && !error && (
        <table cellPadding={8} style={{ borderCollapse: "collapse", border: "1px solid #ddd" }}>
          <thead>
            <tr><th>Name</th><th>Value</th><th>Unit</th></tr>
          </thead>
          <tbody>
            {metrics.map((m, i) => (
              <tr key={i}>
                <td>{m.name}</td>
                <td>{m.value}</td>
                <td>{m.unit ?? "â€”"}</td>
              </tr>
            ))}
            {metrics.length === 0 && (
              <tr><td colSpan={3}>No metrics found.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TreasuryPage;
