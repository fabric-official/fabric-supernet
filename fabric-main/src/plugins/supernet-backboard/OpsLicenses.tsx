// src/plugins/supernet-backboard/OpsLicenses.tsx
// Production-grade License Management (no mocks)
import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Users, Package, Calendar, Shield, AlertTriangle, Key, Plus, Upload } from "lucide-react";
import { FabricPluginHost, Device } from "@/types/plugin";
import { useToast } from "@/hooks/use-toast";

function toArray<T = any>(input: any): T[] {
  try {
    if (Array.isArray(input)) return input;
    if (input == null) return [];
    if (typeof input === "object") {
      const maybe = (input as any).items ?? (input as any).data;
      if (Array.isArray(maybe)) return maybe;
      return Object.values(input as any);
    }
    return [];
  } catch (e) {
    console.error("[Licenses] toArray error:", e);
    return [];
  }
}

interface OpsLicensesProps {
  host: FabricPluginHost;
}

export interface LicenseInfo {
  lic_id: string;
  pkg: string;
  seats: number;
  devices: number;
  revoked?: boolean;
  expired?: boolean;          // host-derived or derived from expires_at
  expires_at?: string;        // ISO
  issuer?: string;
  fingerprint?: string;
}

export const OpsLicenses: React.FC<OpsLicensesProps> = ({ host }) => {
  const [licenses, setLicenses] = useState<LicenseInfo[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  const [bindDialogOpen, setBindDialogOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<LicenseInfo | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [binding, setBinding] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [fileBusy, setFileBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  useEffect(() => {
    loadLicensesAndDevices();
  }, []);

  const loadLicensesAndDevices = async () => {
    setLoading(true);
    try {
      const licenseList = await host.licenses.list();
      const normalized = toArray<LicenseInfo>(licenseList).map((l) => {
        const e = (l as any).expires_at ? new Date((l as any).expires_at).getTime() : undefined;
        const expired = e ? Date.now() > e : !!(l as any).expired;
        return { ...l, expired };
      });
      setLicenses(normalized);

      const deviceList = await host.runtime.invoke<Device[]>("device.list");
      setDevices(toArray(deviceList));
    } catch (error) {
      console.error("Failed to load licenses:", error);
      toast({ title: "Error", description: "Failed to load license information", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleBindSeat = async () => {
    if (!selectedLicense || !selectedDevice) return;
    setBinding(true);
    try {
      await host.runtime.invoke("license.activate", {
        licId: selectedLicense.lic_id,
        pkg: selectedLicense.pkg,
        deviceFp: selectedDevice,
      });

      await host.provenance.emit({
        type: "LicenseBoundDelta",
        payload: { lic_id: selectedLicense.lic_id, deviceFp: selectedDevice, pkg: selectedLicense.pkg },
      } as any);

      toast({
        title: "Seat Bound",
        description: `License ${selectedLicense.lic_id} bound to device successfully`,
      });

      setBindDialogOpen(false);
      setSelectedLicense(null);
      setSelectedDevice("");
      loadLicensesAndDevices();
    } catch (error: any) {
      toast({
        title: "Binding Failed",
        description: error?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBinding(false);
    }
  };

  const onPickFile = () => fileInputRef.current?.click();

  const onFileChosen: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileBusy(true);
    try {
      const buf = new Uint8Array(await f.arrayBuffer());
      const res = await host.licenses.import(buf);
      await host.provenance.emit({
        type: "LicenseImportedDelta",
        payload: { lic_id: res?.lic?.lic_id ?? "unknown" },
      } as any);
      toast({ title: "License Added", description: `ID ${res?.lic?.lic_id ?? "—"}` });
      setAddOpen(false);
      await loadLicensesAndDevices();
    } catch (err: any) {
      toast({
        title: "Import failed",
        description: err?.message ?? "Verification failed",
        variant: "destructive",
      });
    } finally {
      // Reset the input so the same file can be re-selected later if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
      setFileBusy(false);
    }
  };

  const getStatusBadge = (license: LicenseInfo) => {
    if (license.revoked) return <Badge variant="outline" className="border-destructive text-destructive">Revoked</Badge>;
    if (license.expired) return <Badge variant="outline" className="border-warning text-warning">Expired</Badge>;
    return <Badge variant="outline" className="border-secure text-secure">Active</Badge>;
  };
  const getStatusIcon = (license: LicenseInfo) => {
    if (license.revoked) return <Shield className="h-4 w-4 text-destructive" />;
    if (license.expired) return <AlertTriangle className="h-4 w-4 text-warning" />;
    return <Shield className="h-4 w-4 text-secure" />;
  };
  const getSeatUtilization = (license: LicenseInfo) => {
    const pct = license.seats > 0 ? (license.devices / license.seats) * 100 : 0;
    return Math.min(pct, 100);
  };
  const getSeatUtilizationColor = (p: number) => (p >= 90 ? "text-destructive" : p >= 75 ? "text-warning" : "text-secure");

  const totalSeats = licenses.reduce((acc, l) => acc + l.seats, 0);
  const usedSeats = licenses.reduce((acc, l) => acc + l.devices, 0);
  const activeLicenses = licenses.filter((l) => !l.expired && !l.revoked).length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">License Management</h1>
            <p className="text-muted-foreground">Package seats and device bindings</p>
          </div>

          {/* Add License */}
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm" className="bg-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                Add License
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Import License</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Label className="text-foreground">
                  License file (.fablic, .jwt, .json, .zip)
                </Label>

                {/* Hidden file input (accepts zip + single files) */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".fablic,.jwt,.json,.zip"
                  className="hidden"
                  onChange={onFileChosen}
                />

                {/* Visible action button */}
                <Button
                  onClick={onPickFile}
                  disabled={fileBusy}
                  className="w-full bg-gradient-primary text-primary-foreground"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {fileBusy ? "Verifying…" : "Choose file"}
                </Button>

                <p className="text-xs text-muted-foreground">
                  Files are verified against CA/CRL and stored atomically in the secure licenses directory.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Total Licenses</p>
                  <p className="text-2xl font-bold text-primary">{licenses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-secure" />
                <div>
                  <p className="text-sm font-medium text-foreground">Active</p>
                  <p className="text-2xl font-bold text-secure">{activeLicenses}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm font-medium text-foreground">Total Seats</p>
                  <p className="text-2xl font-bold text-accent">{totalSeats}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Key className="h-5 w-5 text-warning" />
                <div>
                  <p className="text-sm font-medium text-foreground">Used Seats</p>
                  <p className="text-2xl font-bold text-warning">{usedSeats}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* License Table */}
        <Card className="border-border shadow-soft">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center justify-between">
              <div className="flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Package Licenses ({licenses.length})
              </div>

              <Dialog open={bindDialogOpen} onOpenChange={setBindDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={devices.length === 0} className="border-border hover:bg-muted">
                    <Key className="mr-2 h-4 w-4" />
                    Bind Seat
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-card border-border">
                  <DialogHeader><DialogTitle className="text-foreground">Bind License Seat</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-foreground">License</Label>
                      <Select
                        value={selectedLicense?.lic_id || ""}
                        onValueChange={(v) => setSelectedLicense(licenses.find((l) => l.lic_id === v) || null)}
                      >
                        <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select license" /></SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          {licenses
                            .filter((l) => !l.expired && !l.revoked && l.devices < l.seats)
                            .map((l) => (
                              <SelectItem key={l.lic_id} value={l.lic_id}>
                                {l.lic_id} — {l.pkg} ({l.seats - l.devices} seats available)
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-foreground">Device</Label>
                      <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                        <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select device" /></SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          {toArray<Device>(devices).map((d) => (
                            <SelectItem key={d.fp} value={d.fp}>{d.name} ({d.role})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleBindSeat} disabled={binding || !selectedLicense || !selectedDevice} className="w-full bg-gradient-primary text-primary-foreground">
                      {binding ? "Binding..." : "Bind Seat"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="text-center py-8"><p className="text-muted-foreground">Loading licenses...</p></div>
            ) : licenses.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No licenses available</p>
                <p className="text-sm text-muted-foreground mt-2">Place license files in the licenses/ directory or use “Add License”.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">License ID</TableHead>
                    <TableHead className="text-muted-foreground">Package</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Seat Usage</TableHead>
                    <TableHead className="text-muted-foreground">Utilization</TableHead>
                    <TableHead className="text-muted-foreground">Expires</TableHead>
                    <TableHead className="text-muted-foreground">Issuer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {licenses.map((l) => {
                    const util = getSeatUtilization(l);
                    return (
                      <TableRow key={l.lic_id} className="border-border hover:bg-muted/50">
                        <TableCell className="font-mono text-sm text-foreground">{l.lic_id}</TableCell>
                        <TableCell className="font-medium text-foreground">{l.pkg}</TableCell>
                        <TableCell><div className="flex items-center space-x-2">{getStatusIcon(l)}{getStatusBadge(l)}</div></TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className={`font-medium ${getSeatUtilizationColor(util)}`}>{l.devices} / {l.seats}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Progress value={util} className="w-20 h-2" />
                            <span className={`text-xs ${getSeatUtilizationColor(util)}`}>{util.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground">
                          {l.expires_at ? new Date(l.expires_at).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell className="text-foreground">{l.issuer ?? "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="border-border shadow-soft">
          <CardHeader><CardTitle className="text-foreground flex items-center"><Calendar className="mr-2 h-5 w-5" />License Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-border rounded-lg">
                <h4 className="font-medium text-foreground mb-2">Seat Management</h4>
                <p className="text-sm text-muted-foreground mb-2">Seats are bound to devices on activation. One seat per package per device.</p>
                <p className="text-sm text-muted-foreground">Seat claims are signed and stored in the seats/ directory (append-only).</p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <h4 className="font-medium text-foreground mb-2">License Validation</h4>
                <p className="text-sm text-muted-foreground mb-2">All licenses are cryptographically verified and checked against the CRL.</p>
                <p className="text-sm text-muted-foreground">Expired or revoked licenses cannot be used to start agents.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
