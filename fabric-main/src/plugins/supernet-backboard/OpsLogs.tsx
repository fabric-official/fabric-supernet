// SuperNet Backboard - Audit Logs
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, RefreshCw, Calendar, Filter, Shield, AlertTriangle, Clock } from 'lucide-react';
import { FabricPluginHost, ProvenanceDelta } from '@/types/plugin';
import { useToast } from '@/hooks/use-toast';

interface OpsLogsProps {
  host: FabricPluginHost;
}

export const OpsLogs: React.FC<OpsLogsProps> = ({ host }) => {
  const [auditLogs, setAuditLogs] = useState<ProvenanceDelta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAuditLogs();
  }, [dateFilter]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      // In real implementation, this would call a provenance service method
      // For now, generate mock audit log data
      const mockLogs: ProvenanceDelta[] = [
        {
          type: 'SetupDelta',
          ts: new Date().toISOString(),
          siteId: 'SITE-001',
          payload: {
            siteVersion: '1.0.0',
            wallet: 'fabric-wallet-123'
          },
          sig: 'ed25519signature123...',
          pubkey: 'site-pubkey'
        },
        {
          type: 'JoinDelta',
          ts: new Date(Date.now() - 3600000).toISOString(),
          siteId: 'SITE-001',
          deviceFp: 'sha256:device1fingerprint',
          payload: {
            name: 'edge-device-01',
            role: 'edge'
          },
          sig: 'ed25519signature456...',
          pubkey: 'site-pubkey'
        },
        {
          type: 'LicenseBoundDelta',
          ts: new Date(Date.now() - 7200000).toISOString(),
          siteId: 'SITE-001',
          payload: {
            lic_id: 'LIC-123',
            deviceFp: 'sha256:device1fingerprint',
            pkg: 'fabric-agent-core'
          },
          sig: 'ed25519signature789...',
          pubkey: 'site-pubkey'
        },
        {
          type: 'PolicyViolationDelta',
          ts: new Date(Date.now() - 10800000).toISOString(),
          siteId: 'SITE-001',
          deviceFp: 'sha256:device2fingerprint',
          payload: {
            diagnostics: [
              { severity: 'error', message: 'Unauthorized export attempt detected' }
            ]
          },
          sig: 'ed25519signatureabc...',
          pubkey: 'site-pubkey'
        }
      ] as ProvenanceDelta[];

      setAuditLogs(mockLogs);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      toast({
        title: "Error",
        description: "Failed to load audit logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportLogs = async () => {
    setExporting(true);
    try {
      // In real implementation, call provenance service export method
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];
      
      // Mock export - in real implementation this would generate and download NDJSON
      const exportData = auditLogs.map(log => JSON.stringify(log)).join('\n');
      
      // Create and download blob
      const blob = new Blob([exportData], { type: 'application/x-ndjson' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fabric-audit-${startDate}-to-${endDate}.ndjson`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Audit logs exported successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "Unable to export audit logs",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  const generateTestEvent = async () => {
    try {
      // Emit a test provenance delta
      await host.provenance.emit({
        type: 'CRLUpdateDelta',
        payload: {
          count: 1
        }
      } as any);

      toast({
        title: "Test Event Generated",
        description: "A test CRL update event has been logged",
        variant: "default"
      });

      // Reload logs
      loadAuditLogs();
    } catch (error) {
      console.error('Failed to generate test event:', error);
      toast({
        title: "Error",
        description: "Failed to generate test event",
        variant: "destructive"
      });
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'SetupDelta':
        return <Shield className="h-4 w-4 text-primary" />;
      case 'JoinDelta':
        return <Shield className="h-4 w-4 text-secure" />;
      case 'LicenseBoundDelta':
        return <FileText className="h-4 w-4 text-accent" />;
      case 'PolicyViolationDelta':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'AgentStartDelta':
      case 'AgentStopDelta':
        return <Shield className="h-4 w-4 text-warning" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getEventBadge = (type: string) => {
    const variants: Record<string, string> = {
      'SetupDelta': 'border-primary text-primary',
      'JoinDelta': 'border-secure text-secure',
      'LicenseBoundDelta': 'border-accent text-accent',
      'PolicyViolationDelta': 'border-destructive text-destructive',
      'AgentStartDelta': 'border-warning text-warning',
      'AgentStopDelta': 'border-warning text-warning',
      'CRLUpdateDelta': 'border-warning text-warning'
    };

    return (
      <Badge variant="outline" className={variants[type] || 'border-muted text-muted-foreground'}>
        {type.replace('Delta', '')}
      </Badge>
    );
  };

  const filteredLogs = auditLogs.filter(log => 
    filterType === 'all' || log.type === filterType
  );

  const formatPayload = (log: ProvenanceDelta) => {
    if (log.type === 'JoinDelta' && 'payload' in log) {
      return `Device: ${log.payload.name} (${log.payload.role})`;
    }
    if (log.type === 'LicenseBoundDelta' && 'payload' in log) {
      return `License: ${log.payload.lic_id} â†’ Package: ${log.payload.pkg}`;
    }
    if (log.type === 'SetupDelta' && 'payload' in log) {
      return `Site: ${log.payload.siteVersion} â†’ Wallet: ${log.payload.wallet.slice(0, 16)}...`;
    }
    if (log.type === 'PolicyViolationDelta' && 'payload' in log) {
      return `${log.payload.diagnostics.length} violations detected`;
    }
    return JSON.stringify(log.payload).slice(0, 50) + '...';
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Audit Logs</h1>
            <p className="text-muted-foreground">Provenance tail and export (append-only signed deltas)</p>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={generateTestEvent}
              className="border-border hover:bg-muted"
            >
              <FileText className="mr-2 h-4 w-4" />
              Test Event
            </Button>
            <Button 
              onClick={handleExportLogs}
              disabled={exporting}
              className="bg-gradient-primary text-primary-foreground hover:opacity-90"
            >
              <Download className={`mr-2 h-4 w-4 ${exporting ? 'animate-bounce' : ''}`} />
              {exporting ? 'Exporting...' : 'Export Logs'}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-border shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium text-foreground">Filters:</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Label className="text-sm text-muted-foreground">Date:</Label>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-40 bg-background border-border"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Label className="text-sm text-muted-foreground">Type:</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-48 bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="SetupDelta">Setup</SelectItem>
                    <SelectItem value="JoinDelta">Device Join</SelectItem>
                    <SelectItem value="LicenseBoundDelta">License Binding</SelectItem>
                    <SelectItem value="PolicyViolationDelta">Policy Violations</SelectItem>
                    <SelectItem value="AgentStartDelta">Agent Start</SelectItem>
                    <SelectItem value="AgentStopDelta">Agent Stop</SelectItem>
                    <SelectItem value="CRLUpdateDelta">CRL Updates</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadAuditLogs}
                disabled={loading}
                className="border-border hover:bg-muted"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Audit Log Table */}
        <Card className="border-border shadow-soft">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Provenance Events ({filteredLogs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-muted-foreground">Loading audit logs...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No audit events found</p>
                <p className="text-sm text-muted-foreground mt-2">Try adjusting the filters or generate a test event</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Timestamp</TableHead>
                    <TableHead className="text-muted-foreground">Event Type</TableHead>
                    <TableHead className="text-muted-foreground">Site ID</TableHead>
                    <TableHead className="text-muted-foreground">Details</TableHead>
                    <TableHead className="text-muted-foreground">Signature</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log, index) => (
                    <TableRow key={index} className="border-border hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-foreground">
                            {new Date(log.ts).toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getEventIcon(log.type)}
                          {getEventBadge(log.type)}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {log.siteId}
                      </TableCell>
                      <TableCell className="text-sm text-foreground max-w-xs truncate">
                        {formatPayload(log)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Shield className="h-3 w-3 text-secure" />
                          <span className="font-mono text-xs text-muted-foreground">
                            {log.sig.slice(0, 16)}...
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Export Information */}
        <Card className="border-border shadow-soft">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Audit Log Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-border rounded-lg">
                <h4 className="font-medium text-foreground mb-2">Append-Only Logging</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  All events are cryptographically signed and stored in append-only NDJSON format.
                </p>
                <p className="text-sm text-muted-foreground">
                  Daily rotation ensures manageable file sizes while maintaining complete audit trails.
                </p>
              </div>

              <div className="p-4 border border-border rounded-lg">
                <h4 className="font-medium text-foreground mb-2">Signature Verification</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Each delta is signed with the site's Ed25519 private key for tamper detection.
                </p>
                <p className="text-sm text-muted-foreground">
                  Export includes full provenance chain for external verification and compliance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};