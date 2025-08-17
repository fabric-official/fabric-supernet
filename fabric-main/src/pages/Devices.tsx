import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Monitor, Smartphone, Server, Router,
  Plus, RefreshCw, CheckCircle, XCircle,
  Copy, Download
} from "lucide-react";
// IMPORTANT: robust import to avoid undefined default in some bundlers/tsconfig
import * as QR from "qrcode";

interface Device {
  fp: string;
  name: string;
  role: "edge" | "gateway" | "sensor" | "compute";
  online: boolean;
  lastHeartbeat: string;
  enrolledAt: string;
  pubkey?: string;
}

declare global {
  interface Window {
    fabricHost?: { runtime: { invoke: (name: string, args?: any) => Promise<any> } };
  }
}

export default function Devices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [discovering, setDiscovering] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);

  const [newDevice, setNewDevice] = useState({ fp: "", name: "", role: "" as Device["role"] });

  // Pairing + QR state
  const [pairingUrl, setPairingUrl] = useState<string>("");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [qrError, setQrError] = useState<string>("");

  // ---- Helpers ----
  const hasForm = !!(newDevice.fp && newDevice.name && newDevice.role);

  const fallbackPairUrl = useMemo(() => {
    if (!hasForm) return "";
    const params = new URLSearchParams({
      deviceId: newDevice.fp,
      name: newDevice.name,
      role: newDevice.role,
      v: "1",
      ts: String(Date.now())
    });
    return `fabric://pair?${params.toString()}`;
  }, [hasForm, newDevice.fp, newDevice.name, newDevice.role]);

  const copyText = async (text: string) => {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}
    // Fallback for HTTP/non-secure or denied permissions
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  };

  const drawQR = async (url: string) => {
    if (!url) {
      setQrDataUrl(""); setQrError(""); return;
    }
    try {
      if (!QR || typeof QR.toDataURL !== "function") {
        setQrError("QR library not available (qrcode.toDataURL undefined). Check import.");
        setQrDataUrl("");
        return;
      }
      const dataUrl = await QR.toDataURL(url, { errorCorrectionLevel: "M", scale: 6, margin: 1 });
      setQrDataUrl(dataUrl);
      setQrError("");
    } catch (err: any) {
      setQrError(err?.message || String(err));
      setQrDataUrl("");
    }
  };

  // Always produce a QR as soon as fields are valid (not gated by dialog)
  useEffect(() => {
    (async () => {
      if (!hasForm) {
        setPairingUrl(""); setQrDataUrl(""); setQrError(""); return;
      }
      // Fallback first so the box is never empty
      setPairingUrl(fallbackPairUrl);
      await drawQR(fallbackPairUrl);

      // Try to upgrade to a live session id
      try {
        if (window.fabricHost?.runtime?.invoke) {
          const res = await window.fabricHost.runtime.invoke("pairing.start", {
            deviceId: newDevice.fp, name: newDevice.name, role: newDevice.role
          });
          const sid = res?.sessionId || res?.sid;
          if (sid) {
            const live = `fabric://pair?sid=${encodeURIComponent(sid)}`;
            setPairingUrl(live);
            await drawQR(live);
          }
        }
      } catch {
        // keep fallback
      }
    })();
  }, [hasForm, fallbackPairUrl, newDevice.fp, newDevice.name, newDevice.role]);

  // Buttons to force-generate known-good QR
  const generateTestQR = async () => {
    const test = "fabric://pair?selftest=1";
    setPairingUrl(test);
    await drawQR(test);
  };
  const generateFallbackQR = async () => {
    if (!fallbackPairUrl) return;
    setPairingUrl(fallbackPairUrl);
    await drawQR(fallbackPairUrl);
  };

  // ---- Runtime hooks ----
  const discoverDevices = async () => {
    setDiscovering(true);
    try {
      const list = await window.fabricHost?.runtime?.invoke("device.list");
      setDevices(Array.isArray(list) ? (list as Device[]) : []);
    } finally {
      setDiscovering(false);
    }
  };

  const enrollDevice = async () => {
    const { fp, name, role } = newDevice;
    if (!fp || !name || !role) return;
    setEnrolling(true);
    try {
      await window.fabricHost?.runtime?.invoke("device.enroll", { fp, name, role });
      try {
        await window.fabricHost?.runtime?.invoke("pairing.start", { deviceId: fp, name, role });
      } catch {}
      await discoverDevices();
      // Keep dialog open so QR remains, just clear form
      setNewDevice({ fp: "", name: "", role: "" as Device["role"] });
    } finally {
      setEnrolling(false);
    }
  };

  useEffect(() => { void discoverDevices(); }, []);

  const getDeviceIcon = (role: Device["role"]) => {
    switch (role) { case "edge": return Monitor; case "gateway": return Router; case "sensor": return Smartphone; case "compute": return Server; default: return Monitor; }
  };
  const getStatusBadge = (d: Device) => d.online ? <Badge className="bg-tech-glow text-background">ONLINE</Badge> : <Badge variant="destructive">OFFLINE</Badge>;
  const getLastSeen = (hb: string) => {
    const diff = Date.now() - new Date(hb).getTime();
    const s = Math.floor(diff/1000), m = Math.floor(s/60), h = Math.floor(m/60);
    if (h>0) return `${h}h ago`; if (m>0) return `${m}m ago`; return `${s}s ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Device Management</h1>
          <p className="text-muted-foreground mt-1">Device Discovery, Enrollment &amp; Health Monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-tech-glow text-tech-glow">
            <Monitor className="w-3 h-3 mr-1" />
            {devices.length} DEVICES
          </Badge>
          <Button variant="outline" size="sm" onClick={generateTestQR} className="border-border">Generate Test QR</Button>
          <Button variant="outline" size="sm" onClick={generateFallbackQR} disabled={!fallbackPairUrl} className="border-border">Force Fallback QR</Button>
          <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />Enroll Device
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Enroll New Device</DialogTitle>
                <DialogDescription>Add a new device to the Fabric network</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Device Fingerprint</Label>
                  <Input placeholder="sha256:..." value={newDevice.fp}
                         onChange={(e) => setNewDevice((p) => ({ ...p, fp: e.target.value }))}
                         className="bg-input border-border font-mono text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Device Name</Label>
                  <Input placeholder="edge-node-03" value={newDevice.name}
                         onChange={(e) => setNewDevice((p) => ({ ...p, name: e.target.value }))}
                         className="bg-input border-border" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Device Role</Label>
                  <Select value={newDevice.role} onValueChange={(v: Device["role"]) => setNewDevice((p) => ({ ...p, role: v }))}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Select device role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="edge">Edge Node</SelectItem>
                      <SelectItem value="gateway">Gateway</SelectItem>
                      <SelectItem value="sensor">Sensor</SelectItem>
                      <SelectItem value="compute">Compute</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* QR block */}
                <div className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-foreground">Pair via QR</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline" size="sm"
                        disabled={!pairingUrl}
                        onClick={async () => { if (pairingUrl) await copyText(pairingUrl); }}
                      >
                        <Copy className="h-4 w-4 mr-1" />Copy URL
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        disabled={!qrDataUrl}
                        onClick={() => {
                          if (!qrDataUrl) return;
                          const a = document.createElement("a");
                          a.download = `pair_${newDevice.name || "device"}.png`;
                          a.href = qrDataUrl;
                          a.click();
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />PNG
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="shrink-0 rounded-md bg-card p-3 border border-border" style={{ width: 208, height: 208 }}>
                      {qrError ? (
                        <div className="w-[192px] h-[192px] grid place-items-center text-xs text-red-500 text-center p-2">
                          QR error: {qrError}
                        </div>
                      ) : qrDataUrl ? (
                        <img src={qrDataUrl} alt="Pairing QR" width={192} height={192}
                             style={{ display: "block", imageRendering: "pixelated" }} />
                      ) : (
                        <div className="w-[192px] h-[192px] grid place-items-center text-xs text-muted-foreground text-center p-2">
                          Fill Fingerprint + Name + Role, or click “Generate Test QR”
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Scan with the mobile pairing app to bind this device.</p>
                      <p className="mt-1">Requires Fingerprint + Name + Role.</p>
                      {pairingUrl && <p className="mt-2 font-mono break-all text-foreground/80">{pairingUrl}</p>}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={enrollDevice}
                          disabled={enrolling || !newDevice.fp || !newDevice.name || !newDevice.role}
                          className="bg-primary hover:bg-primary/90">
                    {enrolling ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    {enrolling ? "Enrolling..." : "Enroll Device"}
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setEnrollDialogOpen(false);
                    setPairingUrl(""); setQrDataUrl(""); setQrError("");
                    setNewDevice({ fp: "", name: "", role: "" as Device["role"] });
                  }} className="border-border">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-tech border-border"><CardContent className="p-4">
          <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-tech-glow" /><div className="text-sm text-muted-foreground">Online</div></div>
          <div className="text-2xl font-bold text-foreground mt-1">{devices.filter(d=>d.online).length}</div>
        </CardContent></Card>
        <Card className="bg-gradient-tech border-border"><CardContent className="p-4">
          <div className="flex items-center gap-2"><XCircle className="h-4 w-4 text-destructive" /><div className="text-sm text-muted-foreground">Offline</div></div>
          <div className="text-2xl font-bold text-foreground mt-1">{devices.filter(d=>!d.online).length}</div>
        </CardContent></Card>
        <Card className="bg-gradient-tech border-border"><CardContent className="p-4">
          <div className="flex items-center gap-2"><Router className="h-4 w-4 text-accent" /><div className="text-sm text-muted-foreground">Gateways</div></div>
          <div className="text-2xl font-bold text-foreground mt-1">{devices.filter(d=>d.role==="gateway").length}</div>
        </CardContent></Card>
        <Card className="bg-gradient-tech border-border"><CardContent className="p-4">
          <div className="flex items-center gap-2"><Monitor className="h-4 w-4 text-primary" /><div className="text-sm text-muted-foreground">Edge</div></div>
          <div className="text-2xl font-bold text-foreground mt-1">{devices.filter(d=>d.role==="edge").length}</div>
        </CardContent></Card>
      </div>

      {/* List */}
      <Card className="bg-gradient-tech border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Enrolled Devices</CardTitle>
              <CardDescription>Fabric network device registry</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={discoverDevices} disabled={discovering} className="border-border">
              <RefreshCw className="h-4 w-4 mr-2" />{discovering ? "Discovering..." : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {devices.map((d) => {
              const Icon = getDeviceIcon(d.role);
              return (
                <div key={d.fp} className="p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-card"><Icon className="h-6 w-6 text-foreground" /></div>
                      <div>
                        <div className="font-medium text-foreground">{d.name}</div>
                        <div className="text-sm text-muted-foreground font-mono">{d.fp.substring(0, 32)}...</div>
                        <div className="text-xs text-muted-foreground mt-1">Role: {d.role} • Enrolled: {new Date(d.enrolledAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Last seen</div>
                        <div className="text-sm font-medium text-foreground">{d.lastHeartbeat ? getLastSeen(d.lastHeartbeat) : "—"}</div>
                      </div>
                      {getStatusBadge(d)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




