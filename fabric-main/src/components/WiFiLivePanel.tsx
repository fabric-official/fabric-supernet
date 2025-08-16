import React, { useState } from "react";

// Uses global Window bridges from src/types/global-bridge.d.ts

}

export default function WiFiLivePanel() {
  const [scanning, setScanning] = useState(false);
  const [networks, setNetworks] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const scanNetworks = async () => {
    setScanning(true); setError(null);
    try {
      if (window.fab?.scanWifi) {
        const res = await window.fab.scanWifi();
        setNetworks(res?.networks ?? []);
      } else {
        const r = await fetch("http://127.0.0.1:47615/wifi/scan");
        if (!r.ok) throw new Error("HTTP " + r.status);
        const j = await r.json();
        setNetworks(j?.networks ?? []);
      }
    } catch (e:any) {
      setError(e?.message || "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div id="wifi-live-panel" style={{padding:12, marginBottom:16, border:"1px solid #ddd", borderRadius:8}}>
      <div style={{display:"flex", gap:8, alignItems:"center"}}>
        <strong>Wi-Fi Live</strong>
        <button onClick={scanNetworks} disabled={scanning}>
          {scanning ? "Scanningâ€¦" : "Scan networks"}
        </button>
        {error && <span style={{color:"red"}}>Error: {error}</span>}
      </div>
      {Array.isArray(networks) && networks.length > 0 && (
        <table className="min-w-full text-sm" style={{marginTop:12}}>
          <thead>
            <tr><th className="text-left">SSID</th><th>BSSID(s)</th><th>Signal</th><th>Channel</th><th>Auth</th></tr>
          </thead>
          <tbody>
            {networks.map((n:any, i:number) => (
              <tr key={i}>
                <td>{n.ssid || <em>(hidden)</em>}</td>
                <td>{(n.bssids||[]).map((b:any)=>b.bssid).join(", ")}</td>
                <td>{(n.bssids?.[0]?.signal) || n.signal || "-"}</td>
                <td>{(n.bssids?.[0]?.channel) || n.channel || "-"}</td>
                <td>{n.auth || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

