import React, { useEffect, useState } from "react";
import { http } from "@/lib/http";

type Network = { ssid?: string; rssi?: number; channel?: number };

export const WifiPage: React.FC = () => {
  const [networks, setNetworks] = useState<Network[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await http.get<any>("/api/wifi/scan");
        const items = Array.isArray(data) ? data : (data.networks ?? []);
        setNetworks(items);
      } catch (e: any) {
        setError(e?.message ?? "Failed to scan Wi-Fi");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h1>Wiâ€‘Fi</h1>
      {loading && <p>Scanningâ€¦</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {!loading && !error && (
        <table cellPadding={8} style={{ borderCollapse: "collapse", border: "1px solid #ddd" }}>
          <thead>
            <tr><th>SSID</th><th>RSSI</th><th>Channel</th></tr>
          </thead>
          <tbody>
            {networks.map((n, i) => (
              <tr key={(n.ssid ?? i).toString()}>
                <td>{n.ssid ?? "â€”"}</td>
                <td>{n.rssi ?? "â€”"}</td>
                <td>{n.channel ?? "â€”"}</td>
              </tr>
            ))}
            {networks.length === 0 && (
              <tr><td colSpan={3}>No networks found.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default WifiPage;
