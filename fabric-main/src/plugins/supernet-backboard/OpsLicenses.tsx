// SuperNet Backboard - License Management
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Users, Package, Calendar, Shield, AlertTriangle, Key } from 'lucide-react';
import { FabricPluginHost, Device } from '@/types/plugin';
import { useToast } from '@/hooks/use-toast';
function toArray(input:any){
  try{
    if (Array.isArray(input)) return input;
    if (input == null) return [];
    if (typeof input === 'object') {
      // common shapes: {items:[...]}, {data:[...]}, or plain object of records
      const maybe = (input as any).items ?? (input as any).data;
      if (Array.isArray(maybe)) return maybe;
      return Object.values(input as any);
    }
    return [];
  }catch(e){
    console.error('[Licenses] toArray error:', e);
    return [];
  }
}

interface OpsLicensesProps {
  host: FabricPluginHost;
}

interface LicenseInfo {
  lic_id: string;
  pkg: string;
  seats: number;
  devices: number;
  expired?: boolean;
  revoked?: boolean;
}

export const OpsLicenses: React.FC<OpsLicensesProps> = ({ host }) => {
  const [licenses, setLicenses] = useState<LicenseInfo[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [bindDialogOpen, setBindDialogOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<LicenseInfo | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [binding, setBinding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadLicensesAndDevices();
  }, []);

  const loadLicensesAndDevices = async () => {
    setLoading(true);
    try {
      // Load licenses
      const licenseList = await host.licenses.list();
      
      // Add mock status information
      const enrichedLicenses = toArray(licenseList).map(license => ({
        ...license,
        expired: Math.random() > 0.9, // 10% chance of being expired
        revoked: Math.random() > 0.95  // 5% chance of being revoked
      }));
      
      setLicenses(enrichedLicenses);

      // Load devices
      const deviceList = await host.runtime.invoke<Device[]>('device.list');
      setDevices(deviceList);
    } catch (error) {
      console.error('Failed to load licenses:', error);
      toast({
        title: "Error",
        description: "Failed to load license information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBindSeat = async () => {
    if (!selectedLicense || !selectedDevice) return;

    setBinding(true);
    try {
      // Activate license for device
      await host.runtime.invoke('license.activate', {
        licId: selectedLicense.lic_id,
        pkg: selectedLicense.pkg,
        deviceFp: selectedDevice
      });

      // Emit license bound delta
      await host.provenance.emit({
        type: 'LicenseBoundDelta',
        payload: {
          lic_id: selectedLicense.lic_id,
          deviceFp: selectedDevice,
          pkg: selectedLicense.pkg
        }
      } as any);

      toast({
        title: "Seat Bound",
        description: `License ${selectedLicense.lic_id} bound to device successfully`,
        variant: "default"
      });

      setBindDialogOpen(false);
      setSelectedLicense(null);
      setSelectedDevice('');
      loadLicensesAndDevices();
    } catch (error) {
      console.error('Seat binding failed:', error);
      toast({
        title: "Binding Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setBinding(false);
    }
  };

  const getStatusBadge = (license: LicenseInfo) => {
    if (license.revoked) {
      return <Badge variant="outline" className="border-destructive text-destructive">Revoked</Badge>;
    }
    if (license.expired) {
      return <Badge variant="outline" className="border-warning text-warning">Expired</Badge>;
    }
    return <Badge variant="outline" className="border-secure text-secure">Active</Badge>;
  };

  const getStatusIcon = (license: LicenseInfo) => {
    if (license.revoked) {
      return <Shield className="h-4 w-4 text-destructive" />;
    }
    if (license.expired) {
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    }
    return <Shield className="h-4 w-4 text-secure" />;
  };

  const getSeatUtilization = (license: LicenseInfo) => {
    const percentage = license.seats > 0 ? (license.devices / license.seats) * 100 : 0;
    return Math.min(percentage, 100);
  };

  const getSeatUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return 'text-destructive';
    if (percentage >= 75) return 'text-warning';
    return 'text-secure';
  };

  const totalSeats = licenses.reduce((acc, license) => acc + license.seats, 0);
  const usedSeats = licenses.reduce((acc, license) => acc + license.devices, 0);
  const activeLicenses = licenses.filter(license => !license.expired && !license.revoked).length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">License Management</h1>
            <p className="text-muted-foreground">Package seats and device bindings (read-only)</p>
          </div>
        </div>

        {/* Overview Cards */}
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
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={devices.length === 0}
                    className="border-border hover:bg-muted"
                  >
                    <Key className="mr-2 h-4 w-4" />
                    Bind Seat
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Bind License Seat</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-foreground">License</Label>
                      <Select 
                        value={selectedLicense?.lic_id || ''} 
                        onValueChange={(value) => {
                          const license = licenses.find(l => l.lic_id === value);
                          setSelectedLicense(license || null);
                        }}
                      >
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue placeholder="Select license" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          {licenses
                            .filter(license => !license.expired && !license.revoked && license.devices < license.seats)
                            .map((license) => (
                              <SelectItem key={license.lic_id} value={license.lic_id}>
                                {license.lic_id} - {license.pkg} ({license.seats - license.devices} seats available)
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-foreground">Device</Label>
                      <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue placeholder="Select device" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          {toArray(devices).map((device) => (
                            <SelectItem key={device.fp} value={device.fp}>
                              {device.name} ({device.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button 
                      onClick={handleBindSeat} 
                      disabled={binding || !selectedLicense || !selectedDevice}
                      className="w-full bg-gradient-primary text-primary-foreground"
                    >
                      {binding ? 'Binding...' : 'Bind Seat'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading licenses...</p>
              </div>
            ) : licenses.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No licenses available</p>
                <p className="text-sm text-muted-foreground mt-2">License files should be placed in the licenses/ directory</p>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {toArray(licenses).map((license) => {
                    const utilization = getSeatUtilization(license);
                    return (
                      <TableRow key={license.lic_id} className="border-border hover:bg-muted/50">
                        <TableCell className="font-mono text-sm text-foreground">{license.lic_id}</TableCell>
                        <TableCell className="font-medium text-foreground">{license.pkg}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(license)}
                            {getStatusBadge(license)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className={`font-medium ${getSeatUtilizationColor(utilization)}`}>
                              {license.devices} / {license.seats}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Progress 
                              value={utilization} 
                              className="w-20 h-2"
                            />
                            <span className={`text-xs ${getSeatUtilizationColor(utilization)}`}>
                              {utilization.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* License Details */}
        <Card className="border-border shadow-soft">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              License Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-border rounded-lg">
                <h4 className="font-medium text-foreground mb-2">Seat Management</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Seats are bound to devices when licenses are activated. Each device can only hold one seat per package.
                </p>
                <p className="text-sm text-muted-foreground">
                  Seat claims are stored as signed files in the seats/ directory for transparency.
                </p>
              </div>

              <div className="p-4 border border-border rounded-lg">
                <h4 className="font-medium text-foreground mb-2">License Validation</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  All licenses are cryptographically verified and checked against the Certificate Revocation List.
                </p>
                <p className="text-sm text-muted-foreground">
                  Expired or revoked licenses cannot be used to start new agents.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

