// SuperNet Backboard - Policy & Compliance
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw, FileText, Clock } from 'lucide-react';
import { FabricPluginHost, Device } from '@/types/plugin';
import { useToast } from '@/hooks/use-toast';

interface OpsComplianceProps {
  host: FabricPluginHost;
}

interface PolicyDiagnostic {
  severity: 'error' | 'warning' | 'info';
  message: string;
  source?: string;
  deviceFp?: string;
}

interface ComplianceStatus {
  deviceFp: string;
  deviceName: string;
  lastChecked: string;
  status: 'compliant' | 'violations' | 'unknown';
  diagnostics: PolicyDiagnostic[];
}

export const OpsCompliance: React.FC<OpsComplianceProps> = ({ host }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus[]>([]);
  const [crlInfo, setCrlInfo] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDevicesAndCompliance();
    loadCRLInfo();
  }, []);

  const loadDevicesAndCompliance = async () => {
    setLoading(true);
    try {
      // Load devices
      const deviceList = await host.runtime.invoke<Device[]>('device.list');
      setDevices(deviceList);

      // Load compliance status for each device
      const statusPromises = deviceList.map(async (device) => {
        try {
          const policyResult = await host.runtime.invoke('policy.verify', {
            deviceFp: device.fp
          });

          return {
            deviceFp: device.fp,
            deviceName: device.name,
            lastChecked: new Date().toISOString(),
            status: policyResult.ok ? 'compliant' : 'violations',
            diagnostics: policyResult.diagnostics || []
          } as ComplianceStatus;
        } catch (error) {
          return {
            deviceFp: device.fp,
            deviceName: device.name,
            lastChecked: new Date().toISOString(),
            status: 'unknown',
            diagnostics: [{ severity: 'error', message: 'Policy verification failed' }]
          } as ComplianceStatus;
        }
      });

      const statuses = await Promise.all(statusPromises);
      setComplianceStatus(statuses);
    } catch (error) {
      console.error('Failed to load compliance data:', error);
      toast({
        title: "Error",
        description: "Failed to load compliance information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCRLInfo = async () => {
    try {
      const crl = await host.security.getCRL();
      setCrlInfo(crl);
    } catch (error) {
      console.error('Failed to load CRL:', error);
    }
  };

  const runComplianceCheck = async (deviceFp?: string) => {
    setChecking(true);
    try {
      const devicesToCheck = deviceFp ? devices.filter(d => d.fp === deviceFp) : devices;
      
      for (const device of devicesToCheck) {
        try {
          const policyResult = await host.runtime.invoke('policy.verify', {
            deviceFp: device.fp
          });

          // If violations found, emit PolicyViolationDelta
          if (!policyResult.ok && policyResult.diagnostics?.length > 0) {
            await host.provenance.emit({
              type: 'PolicyViolationDelta',
              deviceFp: device.fp,
              payload: {
                diagnostics: policyResult.diagnostics
              }
            } as any);
          }

          // Update compliance status
          setComplianceStatus(prev => prev.map(status => 
            status.deviceFp === device.fp 
              ? {
                  ...status,
                  lastChecked: new Date().toISOString(),
                  status: policyResult.ok ? 'compliant' : 'violations',
                  diagnostics: policyResult.diagnostics || []
                }
              : status
          ));
        } catch (error) {
          console.error(`Policy check failed for device ${device.fp}:`, error);
        }
      }

      toast({
        title: "Compliance Check Complete",
        description: deviceFp ? "Device policy verified" : "All devices checked for policy compliance",
        variant: "default"
      });
    } catch (error) {
      console.error('Compliance check failed:', error);
      toast({
        title: "Check Failed",
        description: "Policy compliance check encountered errors",
        variant: "destructive"
      });
    } finally {
      setChecking(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-4 w-4 text-secure" />;
      case 'violations':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return <Badge variant="outline" className="border-secure text-secure">Compliant</Badge>;
      case 'violations':
        return <Badge variant="outline" className="border-destructive text-destructive">Violations</Badge>;
      default:
        return <Badge variant="outline" className="border-warning text-warning">Unknown</Badge>;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-3 w-3 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-3 w-3 text-warning" />;
      default:
        return <CheckCircle className="h-3 w-3 text-primary" />;
    }
  };

  const totalViolations = complianceStatus.reduce((acc, status) => 
    acc + status.diagnostics.filter(d => d.severity === 'error').length, 0
  );

  const totalWarnings = complianceStatus.reduce((acc, status) => 
    acc + status.diagnostics.filter(d => d.severity === 'warning').length, 0
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Policy & Compliance</h1>
            <p className="text-muted-foreground">Policy verification and CRL management</p>
          </div>
          
          <Button 
            onClick={() => runComplianceCheck()} 
            disabled={checking || loading}
            className="bg-gradient-primary text-primary-foreground hover:opacity-90"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking...' : 'Run Compliance Check'}
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Total Devices</p>
                  <p className="text-xl font-bold text-primary">{devices.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-secure" />
                <div>
                  <p className="text-sm font-medium text-foreground">Compliant</p>
                  <p className="text-xl font-bold text-secure">
                    {complianceStatus.filter(s => s.status === 'compliant').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-foreground">Violations</p>
                  <p className="text-xl font-bold text-destructive">{totalViolations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div>
                  <p className="text-sm font-medium text-foreground">Warnings</p>
                  <p className="text-xl font-bold text-warning">{totalWarnings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Critical Violations Alert */}
        {totalViolations > 0 && (
          <Alert className="border-destructive/20 bg-destructive/5">
            <XCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-foreground">
              <strong>Policy violations detected!</strong> {totalViolations} critical violations found across your devices. 
              Agent start/update operations are blocked until resolved.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="devices" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-card border border-border">
            <TabsTrigger value="devices" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Device Compliance
            </TabsTrigger>
            <TabsTrigger value="crl" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Certificate Revocation
            </TabsTrigger>
            <TabsTrigger value="policies" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Policy Rules
            </TabsTrigger>
          </TabsList>

          <TabsContent value="devices" className="space-y-4">
            <Card className="border-border shadow-soft">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Device Compliance Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-muted-foreground">Loading compliance data...</p>
                  </div>
                ) : complianceStatus.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No devices to check</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-muted-foreground">Device</TableHead>
                        <TableHead className="text-muted-foreground">Status</TableHead>
                        <TableHead className="text-muted-foreground">Issues</TableHead>
                        <TableHead className="text-muted-foreground">Last Checked</TableHead>
                        <TableHead className="text-muted-foreground">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {complianceStatus.map((status) => (
                        <TableRow key={status.deviceFp} className="border-border hover:bg-muted/50">
                          <TableCell className="font-medium text-foreground">{status.deviceName}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(status.status)}
                              {getStatusBadge(status.status)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {status.diagnostics.slice(0, 2).map((diagnostic, index) => (
                                <div key={index} className="flex items-center space-x-2 text-sm">
                                  {getSeverityIcon(diagnostic.severity)}
                                  <span className="text-muted-foreground truncate max-w-xs">
                                    {diagnostic.message}
                                  </span>
                                </div>
                              ))}
                              {status.diagnostics.length > 2 && (
                                <p className="text-xs text-muted-foreground">
                                  +{status.diagnostics.length - 2} more
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span className="text-sm">
                                {new Date(status.lastChecked).toLocaleString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => runComplianceCheck(status.deviceFp)}
                              disabled={checking}
                              className="border-border hover:bg-muted"
                            >
                              Recheck
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="crl" className="space-y-4">
            <Card className="border-border shadow-soft">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Certificate Revocation List (CRL)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {crlInfo ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Revoked Licenses</Label>
                        <p className="text-2xl font-bold text-destructive">{crlInfo.revoked?.length || 0}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                        <p className="text-foreground">
                          {crlInfo.updated_at ? new Date(crlInfo.updated_at).toLocaleString() : 'Unknown'}
                        </p>
                      </div>
                    </div>
                    
                    {crlInfo.revoked?.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground mb-2 block">Revoked License IDs</Label>
                        <div className="space-y-2">
                          {crlInfo.revoked.map((licId: string, index: number) => (
                            <Badge key={index} variant="outline" className="border-destructive text-destructive mr-2">
                              {licId}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">CRL information unavailable</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="policies" className="space-y-4">
            <Card className="border-border shadow-soft">
              <CardHeader>
                <CardTitle className="text-foreground">Policy Enforcement Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-primary/20 bg-primary/5">
                  <Shield className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-foreground">
                    <strong>Hardened Policy Enforcement:</strong> All agent operations are subject to policy verification.
                    Agents with <code>forkable:false</code> or <code>distribution:"closed"</code> are strictly controlled.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <div className="p-3 border border-border rounded-lg">
                    <h4 className="font-medium text-foreground mb-2">License Validation</h4>
                    <p className="text-sm text-muted-foreground">
                      All closed agents require valid, non-expired, non-revoked licenses with available seat bindings.
                    </p>
                  </div>

                  <div className="p-3 border border-border rounded-lg">
                    <h4 className="font-medium text-foreground mb-2">Export/Fork Restrictions</h4>
                    <p className="text-sm text-muted-foreground">
                      Agents marked as non-forkable or closed distribution cannot be exported, published, or forked.
                    </p>
                  </div>

                  <div className="p-3 border border-border rounded-lg">
                    <h4 className="font-medium text-foreground mb-2">CRL Enforcement</h4>
                    <p className="text-sm text-muted-foreground">
                      Exclusive agents using revoked licenses are terminated within 15 minutes of CRL updates.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};