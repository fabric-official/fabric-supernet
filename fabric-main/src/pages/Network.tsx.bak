// SuperNet Backboard - Network Configuration (wired, no mocks)
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Wifi,
  WifiOff,
  Signal,
  Lock,
  Unlock,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Router,
} from "lucide-react";

declare global {
  interface Window {
    fab?: {
      scanWifi: () => Promise<any>;
      // if you have a native join, uncomment this:
      // joinWifi?: (args: { ssid: string; psk?: string }) => Promise<{ success: boolean; error?: string }>;
    };
  }
}

interface WiFiNetwork {
  ssid: string;
  signal: number;   // 0..100
  secured: boolean;
  frequency: string; // e.g. "2.4GHz" | "5GHz" | "6GHz" | ""
}

export default function Network() {
  const [networks, setNetworks] = useState<WiFiNetwork[]>([]);
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [password, setPassword] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connected" | "connecting">("disconnected");
  const [connectedSSID, setConnectedSSID] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // ---- helpers (no UI changes) ----
  const rssiToPercent = (rssi?: number) => {
    if (typeof rssi !== "number" || Number.isNaN(rssi)) return 0;
    const clamped = Math.max(-90, Math.min(-30, rssi)); // -90..-30 dBm -> 0..100
    return Math.round(((clamped + 90) / 60) * 100);
  };

  const qualityToPercent = (q?: number) => {
    if (typeof q !== "number" || Number.isNaN(q)) return 0;
    const max = q > 70 ? 100 : 70; // common outputs: 0..70 or 0..100
    return Math.round((Math.max(0, Math.min(max, q)) / max) * 100);
  };

  const inferSecured = (cap?: string | string | string[] | boolean) => {
    if (typeof cap === "boolean") return cap;
    const raw = Array.isArray(cap) ? cap.join(" ") : (cap || "");
    const u = raw.toString().toUpperCase();
    if (!u) return false;
    // look for WPA/WPA2/WPA3/WEP flags
    return u.includes("WPA") || u.includes("WEP");
  };

  const inferFrequency = (n: any): string => {
    const f = n?.frequency ?? n?.freq ?? n?.band ?? n?.channel ?? "";
    if (typeof f === "number") {
      // approximate from channel/freq
      if (f >= 1 && f <= 14) return "2.4GHz";
      if (f >= 32 && f <= 165) return "5GHz";
      return "";
    }
    if (typeof f === "string") {
      const s = f.toLowerCase();
      if (s.includes("2.4")) return "2.4GHz";
      if (s.includes("5")) return "5GHz";
      if (s.includes("6")) return "6GHz";
      if (s.includes("ghz")) return s.replace(/\s+/g, "");
      return s || "";
    }
    return "";
  };

  const normalizeNetworks = (raw: any): WiFiNetwork[] => {
    // accepted shapes:
    // {networks:[...]}, [...], or {ssids:[...]}
    const items: any[] = Array.isArray(raw)
      ? raw
      : raw?.networks && Array.isArray(raw.networks)
      ? raw.networks
      : raw?.ssids && Array.isArray(raw.ssids)
      ? raw.ssids.map((s: string) => ({ ssid: s }))
      : [];

    const mapped: WiFiNetwork[] = items
      .map((n) => {
        const ssid = n?.ssid ?? n?.SSID ?? n?.name ?? "";
        if (!ssid) return null;

        // signal: prefer explicit 0..100, then rssi dBm, then quality
        const explicit = typeof n?.signal === "number" ? n.signal : undefined;
        const rssi = typeof n?.rssi === "number" ? n.rssi : typeof n?.level === "number" ? n.level : undefined;
        const qual = typeof n?.quality === "number" ? n.quality : undefined;

        let signal = 0;
        if (typeof explicit === "number" && explicit >= 0 && explicit <= 100) {
          signal = Math.round(explicit);
        } else if (typeof rssi === "number") {
          signal = rssiToPercent(rssi);
        } else if (typeof qual === "number") {
          signal = qualityToPercent(qual);
        }

        const secured = inferSecured(n?.security ?? n?.capabilities ?? n?.flags ?? n?.type);
        const frequency = inferFrequency(n);

        return { ssid, signal, secured, frequency };
      })
      .filter(Boolean) as WiFiNetwork[];

    // sort by signal desc, keep your UX
    return mapped.sort((a, b) => b.signal - a.signal);
  };

  // ---- REAL scan (no mocks) ----
  const scanNetworks = async () => {
    setScanning(true);
    setError(null);
    try {
      let raw: any;

      if (window.fab?.scanWifi) {
        raw = await window.fab.scanWifi();
      } else {
        const r = await fetch("http://127.0.0.1:47615/wifi/scan");
        if (!r.ok) throw new Error("HTTP " + r.status);
        raw = await r.json();
      }

      const list = normalizeNetworks(raw);
      setNetworks(list);
    } catch (e: any) {
      setError(e?.message || "Scan failed");
      setNetworks([]); // don't leave stale data
    } finally {
      setScanning(false);
    }
  };

  // ---- Connect (wired to native if available; otherwise tries localhost stub) ----
  const connectToNetwork = async () => {
    if (!selectedNetwork) return;
    setConnecting(true);
    setConnectionStatus("connecting");
    setError(null);

    try {
      // prefer native bridge if present
      if (window.fab && (window.fab as any).joinWifi) {
        const res = await (window.fab as any).joinWifi({
          ssid: selectedNetwork,
          psk: password || undefined,
        });
        if (!res?.success) throw new Error(res?.error || "Join failed");
      } else {
        // fallback: local HTTP helper if you have one running
        const r = await fetch("http://127.0.0.1:47615/wifi/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ssid: selectedNetwork, psk: password || undefined }),
        });
        if (!r.ok) {
          const t = await r.text().catch(() => "");
          throw new Error(t || "Join failed (HTTP " + r.status + ")");
        }
      }

      setConnectionStatus("connected");
      setConnectedSSID(selectedNetwork);
      setConnecting(false);
      setPassword("");
      // mark as selected but keep it visible
      setNetworks((prev) =>
        prev.map((n) => (n.ssid === selectedNetwork ? { ...n } : n))
      );
    } catch (e: any) {
      setConnectionStatus("disconnected");
      setConnecting(false);
      setError(e?.message || "Unable to connect");
    }
  };

  useEffect(() => {
    scanNetworks();
  }, []);

  const getSignalIcon = (strength: number) => {
    if (strength >= 75) return <Signal className="h-4 w-4 text-tech-glow" />;
    if (strength >= 50) return <Signal className="h-4 w-4 text-accent" />;
    return <Signal className="h-4 w-4 text-muted-foreground" />;
  };

  const getSignalStrength = (strength: number) => {
    if (strength >= 75) return "Excellent";
    if (strength >= 50) return "Good";
    if (strength >= 25) return "Fair";
    return "Poor";
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Network Configuration</h1>
          <p className="text-muted-foreground mt-1">Wi-Fi Management & Network Operations</p>
        </div>
        <Badge variant="outline" className="border-tech-glow text-tech-glow">
          <Wifi className="w-3 h-3 mr-1" />
          NETWORK
        </Badge>
      </div>

      {/* Error banner (if any) */}
      {error && (
        <Alert className="border-destructive/40 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-danger-glow" />
          <AlertDescription className="text-foreground">{error}</AlertDescription>
        </Alert>
      )}

      {/* Connection Status */}
      <Card className="bg-gradient-tech border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Router className="h-5 w-5 text-tech-glow" />
              <CardTitle className="text-foreground">Connection Status</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={scanNetworks}
              disabled={scanning}
              className="border-border"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${scanning ? "animate-spin" : ""}`} />
              {scanning ? "Scanning..." : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              {connectionStatus === "connected" ? (
                <CheckCircle className="h-6 w-6 text-tech-glow" />
              ) : connectionStatus === "connecting" ? (
                <RefreshCw className="h-6 w-6 text-accent animate-spin" />
              ) : (
                <WifiOff className="h-6 w-6 text-muted-foreground" />
              )}
              <div>
                <div className="font-medium text-foreground">
                  {connectionStatus === "connected"
                    ? `Connected to ${connectedSSID}`
                    : connectionStatus === "connecting"
                    ? "Connecting..."
                    : "Not Connected"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {connectionStatus === "connected"
                    ? "Network access active"
                    : connectionStatus === "connecting"
                    ? "Establishing connection"
                    : "No active network connection"}
                </div>
              </div>
            </div>
            <Badge
              variant={connectionStatus === "connected" ? "default" : "secondary"}
              className={connectionStatus === "connected" ? "bg-tech-glow text-background" : ""}
            >
              {connectionStatus.toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Available Networks */}
      <Card className="bg-gradient-tech border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Available Networks</CardTitle>
          <p className="text-sm text-muted-foreground">
            Discovered Wi-Fi networks — Select one to establish connection
          </p>
        </CardHeader>
        <CardContent>
          {scanning ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-tech-glow mr-2" />
              <span className="text-muted-foreground">Scanning for networks...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {networks.map((network, index) => (
                <div
                  key={`${network.ssid}-${index}`}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    selectedNetwork === network.ssid
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-border/50 hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedNetwork(network.ssid)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getSignalIcon(network.signal)}
                      <div>
                        <div className="font-medium text-foreground">{network.ssid}</div>
                        <div className="text-sm text-muted-foreground">
                          {getSignalStrength(network.signal)} • {network.frequency || "—"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {network.secured ? (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Unlock className="h-4 w-4 text-danger-glow" />
                      )}
                      <Badge variant="outline" className="text-xs">
                        {network.signal}%
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
              {!scanning && networks.length === 0 && (
                <div className="flex items-center justify-center py-10 text-muted-foreground">
                  <WifiOff className="h-5 w-5 mr-2" />
                  No networks found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connection Form */}
      {selectedNetwork && (
        <Card className="bg-gradient-tech border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Connect to {selectedNetwork}</CardTitle>
            <p className="text-sm text-muted-foreground">Enter network credentials to establish connection</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {networks.find((n) => n.ssid === selectedNetwork)?.secured && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  Network Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter Wi-Fi password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-input border-border"
                />
              </div>
            )}

            <Separator />

            <div className="flex gap-3">
              <Button
                onClick={connectToNetwork}
                disabled={
                  connecting ||
                  (!!networks.find((n) => n.ssid === selectedNetwork)?.secured && !password)
                }
                className="bg-primary hover:bg-primary/90"
              >
                {connecting ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Wifi className="h-4 w-4 mr-2" />
                )}
                {connecting ? "Connecting..." : "Connect"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedNetwork("");
                  setPassword("");
                }}
                className="border-border"
              >
                Cancel
              </Button>
            </div>

            {!networks.find((n) => n.ssid === selectedNetwork)?.secured && (
              <Alert className="border-danger-glow/30 bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-danger-glow" />
                <AlertDescription className="text-foreground">
                  This network is unsecured. Data transmitted may not be encrypted.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}


