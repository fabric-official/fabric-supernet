// SuperNet Backboard - Device Management
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, HardDrive, Wifi, WifiOff, Clock, Shield, Copy, Download } from 'lucide-react';
import { FabricPluginHost, Device } from '@/types/plugin';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';

function asArray<T>(v: any): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v === null || v === undefined) return [];
  try { return Array.isArray((v as any).items) ? (v as any).items as T[] : [v as T]; } catch { return []; }
}

interface OpsDevicesProps {
  host: FabricPluginHost;
}

export const OpsDevices: React.FC<OpsDevicesProps> = ({ host }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [enrollForm, setEnrollForm] = useState({
    fp: '',
    name: '',
    role: 'edge'
  });
  const { toast } = useToast();

  // --- QR wiring ---
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pairingPayload = useMemo(() => {
    // keep minimal & self-contained; mobile side parses this and calls startPairing()
    return JSON.stringify({
      deviceId: enrollForm.fp,
      name: enrollForm.name,
      role: enrollForm.role,
      ts: Date.now(),
      v: 1,
    });
  }, [enrollForm.fp, enrollForm.name, enrollForm.role]);

  useEffect(() => {
    if (!enrollDialogOpen) return;
    if (!qrCanvasRef.current) return;
    // Only draw when required fields are present (prevents blank QR)
    if (!enrollForm.fp || !enrollForm.name) return;
    QRCode.toCanvas(qrCanvasRef.current, pairingPayload, {
      errorCorrectionLevel: 'M',
      scale: 4,
      margin: 1,
    }).catch(err => console.error('QR render error:', err));
  }, [enrollDialogOpen, pairingPayload, enrollForm.fp, enrollForm.name]);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const deviceList = await host.runtime.invoke<Device[]>('device.list');
      setDevices(deviceList);
    } catch (error) {
      console.error('Failed to load devices:', error);
      toast({
        title: "Error",
        description: "Failed to load device list",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollDevice = async () => {
    try {
      if (!enrollForm.fp || !enrollForm.name || !enrollForm.role) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }

      // Enroll device
      await host.runtime.invoke('device.enroll', {
        fp: enrollForm.fp,
        name: enrollForm.name,
        role: enrollForm.role
      });

      // Create device file
      const deviceData = {
        fp: enrollForm.fp,
        name: enrollForm.name,
        role: enrollForm.role,
        enrolledAt: new Date().toISOString(),
        pubkey: 'ed25519:device-generated-key',
        signature: 'device-enrollment-signature'
      };

      await host.git.write(
        `devices/${enrollForm.fp.replace(':', '_')}.json`,
        JSON.stringify(deviceData, null, 2),
        `feat(devices): enroll ${enrollForm.name}`
      );

      // Emit JoinDelta
      await host.provenance.emit({
        type: 'JoinDelta',
        deviceFp: enrollForm.fp,
        payload: {
          name: enrollForm.name,
          role: enrollForm.role
        }
      } as any);

      toast({
        title: "Device Enrolled",
        description: `${enrollForm.name} has been successfully enrolled`,
        variant: "default"
      });

      setEnrollDialogOpen(false);
      setEnrollForm({ fp: '', name: '', role: 'edge' });
      loadDevices();
    } catch (error) {
      console.error('Device enrollment failed:', error);
      toast({
        title: "Enrollment Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (device: Device) => {
    if (device.online) {
      return <Wifi className="h-4 w-4 text-secure" />;
    }
    return <WifiOff className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusBadge = (device: Device) => {
    if (device.online) {
      return <Badge variant="outline" className="border-secure text-secure">Online</Badge>;
    }
    return <Badge variant="outline" className="border-muted text-muted-foreground">Offline</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      edge: 'bg-primary/10 text-primary border-primary/20',
      compute: 'bg-accent/10 text-accent border-accent/20',
      storage: 'bg-warning/10 text-warning border-warning/20'
    };
    return (
      <Badge variant="outline" className={variants[role as keyof typeof variants] || variants.edge}>
        {role}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Device Management</h1>
            <p className="text-muted-foreground">Discover, enroll, and manage edge devices</p>
          </div>

          <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
            <DialogTrigger asChild>
              {/* High-contrast visible button */}
              <Button
                variant="default"
                className="bg-primary text-primary-foreground shadow-md ring-1 ring-border hover:bg-primary/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Enroll Device
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Enroll New Device</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="deviceFp" className="text-foreground">Device Fingerprint</Label>
                  <Input
                    id="deviceFp"
                    value={enrollForm.fp}
                    onChange={(e) => setEnrollForm(prev => ({ ...prev, fp: e.target.value }))}
                    placeholder="sha256:device-fingerprint"
                    className="bg-background border-border"
                  />
                </div>

                <div>
                  <Label htmlFor="deviceName" className="text-foreground">Device Name</Label>
                  <Input
                    id="deviceName"
                    value={enrollForm.name}
                    onChange={(e) => setEnrollForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., edge-device-01"
                    className="bg-background border-border"
                  />
                </div>

                <div>
                  <Label htmlFor="deviceRole" className="text-foreground">Role</Label>
                  <Select value={enrollForm.role} onValueChange={(value) => setEnrollForm(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="edge">Edge</SelectItem>
                      <SelectItem value="compute">Compute</SelectItem>
                      <SelectItem value="storage">Storage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Pair via QR */}
                <div className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-foreground">Pair via QR</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { navigator.clipboard?.writeText(pairingPayload); }}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy Payload
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const c = qrCanvasRef.current;
                          if (!c) return;
                          const link = document.createElement('a');
                          link.download = `pair_${enrollForm.name || 'device'}.png`;
                          link.href = c.toDataURL('image/png');
                          link.click();
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        PNG
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="shrink-0 rounded-md bg-card p-3 border border-border">
                      <canvas ref={qrCanvasRef} width={192} height={192} />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Scan this code with the mobile pairing app to bind this device.</p>
                      <p className="mt-1">Requires: Fingerprint + Name entered above.</p>
                    </div>
                  </div>
                </div>

                <Button onClick={handleEnrollDevice} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  <Shield className="mr-2 h-4 w-4" />
                  Enroll Device
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Device List */}
        <Card className="border-border shadow-soft">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <HardDrive className="mr-2 h-5 w-5" />
              Enrolled Devices ({asArray<any>(devices).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading devices...</p>
              </div>
            ) : asArray<any>(devices).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No devices enrolled yet</p>
                <p className="text-sm text-muted-foreground mt-2">Click "Enroll Device" to add your first device</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Name</TableHead>
                    <TableHead className="text-muted-foreground">Role</TableHead>
                    <TableHead className="text-muted-foreground">Fingerprint</TableHead>
                    <TableHead className="text-muted-foreground">Last Heartbeat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {asArray<any>(devices).map((device) => (
                    <TableRow key={device.fp} className="border-border hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(device)}
                          {getStatusBadge(device)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{device.name}</TableCell>
                      <TableCell>{getRoleBadge(device.role)}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {device.fp}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {device.lastHeartbeat ? (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span className="text-sm">
                              {new Date(device.lastHeartbeat).toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm">Never</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
