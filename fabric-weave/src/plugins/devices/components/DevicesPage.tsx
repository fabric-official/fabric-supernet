import React, { useEffect, useState } from "react";
import { http } from "@/lib/http";

type Device = { id?: string | number; name?: string; status?: string };

export const DevicesPage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await http.get<any>("/api/admin/devices");
        const items = Array.isArray(data) ? data : (data.items ?? []);
        setDevices(items);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load devices");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h1>Devices</h1>
      {loading && <p>Loadingâ€¦</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {!loading && !error && (
        <table cellPadding={8} style={{ borderCollapse: "collapse", border: "1px solid #ddd" }}>
          <thead>
            <tr><th>ID</th><th>Name</th><th>Status</th></tr>
          </thead>
          <tbody>
            {devices.map((d, i) => (
              <tr key={(d.id ?? i).toString()}>
                <td>{d.id ?? i}</td>
                <td>{d.name ?? "â€”"}</td>
                <td>{d.status ?? "unknown"}</td>
              </tr>
            ))}
            {devices.length === 0 && (
              <tr><td colSpan={3}>No devices found.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DevicesPage;
