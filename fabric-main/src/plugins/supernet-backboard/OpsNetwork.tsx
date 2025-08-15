// SuperNet Backboard - Network Configuration
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Wifi, WifiOff, Lock, Unlock, RefreshCw, Signal, Shield } from 'lucide-react';
import { FabricPluginHost } from '@/types/plugin';
import { useToast } from '@/hooks/use-toast';

interface OpsNetworkProps {
  host: FabricPluginHost;
}

interface WiFiNetwork {
  ssid: string;
  signal: number;
  security: 'WPA2' | 'WPA3' | 'Open';
  connected: boolean;
}

export const OpsNetwork: React.FC<OpsNetworkProps> = ({ host }) => {
  const [networks, setNetworks] = useState<WiFiNetwork[]>([]);
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<WiFiNetwork | null>(null);
  const [password, setPassword] = useState('');
  const [currentConnection, setCurrentConnection] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadCurrentConnection();
    scanNetworks();
  }, []);

  const loadCurrentConnection = async () => {
    try {
      const siteExists = await host.git.exists('site/site.json');
      if (siteExists) {
        const siteData = await host.git.read('site/site.json');
        const site = JSON.parse(siteData);
        if (site.ssidEnc) {
          // In real implementation, decrypt the SSID
          setCurrentConnection('FabricNet-Secure');
        }
      }
    } catch (error) {
      console.error('Failed to load current connection:', error);
    }
  };

  const scanNetworks = async () => {
    setScanning(true);
    try {
      const scanResult = await host.runtime.invoke<{ ssids: string[] }>('wifi.scan');
      
      // Mock network data with signal strength and security
      const mockNetworks: WiFiNetwork[] = scanResult.ssids.map((ssid, index) => ({
        ssid,
        signal: Math.floor(Math.random() * 100) + 1,
        security: ['WPA2', 'WPA3', 'Open'][Math.floor(Math.random() * 3)] as 'WPA2' | 'WPA3' | 'Open',
        connected: ssid === currentConnection
      }));
      
      setNetworks(mockNetworks.sort((a, b) => b.signal - a.signal));
    } catch (error) {
      console.error('WiFi scan failed:', error);
      toast({
        title: "Scan Failed",
        description: "Unable to scan for wireless networks",
        variant: "destructive"
      });
    } finally {
      setScanning(false);
    }
  };

  const handleJoinNetwork = async () => {
    if (!selectedNetwork) return;
    
    setConnecting(true);
    try {
      // Join the network
      const result = await host.runtime.invoke('wifi.join', {
        ssid: selectedNetwork.ssid,
        psk: password
      });

      if (result.success) {
        // Update site configuration with encrypted credentials
        const siteExists = await host.git.exists('site/site.json');
        let siteConfig: any = {};
        
        if (siteExists) {
          const siteData = await host.git.read('site/site.json');
          siteConfig = JSON.parse(siteData);
        }

        // In real implementation: encrypt the WiFi credentials
        siteConfig.ssidEnc = 'encrypted-wifi-credentials';
        siteConfig.lastNetworkUpdate = new Date().toISOString();

        await host.git.write('site/site.json', JSON.stringify(siteConfig, null, 2));
        await host.git.push('feat(network): update WiFi configuration');

        setCurrentConnection(selectedNetwork.ssid);
        
        // Update networks list
        setNetworks(prev => prev.map(net => ({
          ...net,
          connected: net.ssid === selectedNetwork.ssid
        })));

        toast({
          title: "Connected",
          description: `Successfully connected to ${selectedNetwork.ssid}`,
          variant: "default"
        });

        setJoinDialogOpen(false);
        setPassword('');
        setSelectedNetwork(null);
      }
    } catch (error) {
      console.error('Network join failed:', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Unable to connect to network",
        variant: "destructive"
      });
    } finally {
      setConnecting(false);
    }
  };

  const getSecurityIcon = (security: string) => {
    if (security === 'Open') {
      return <Unlock className="h-4 w-4 text-warning" />;
    }
    return <Lock className="h-4 w-4 text-secure" />;
  };

  const getSecurityBadge = (security: string) => {
    const variants = {
      'WPA3': 'border-secure text-secure',
      'WPA2': 'border-primary text-primary',
      'Open': 'border-warning text-warning'
    };
    
    return (
      <Badge variant="outline" className={variants[security as keyof typeof variants]}>
        {security}
      </Badge>
    );
  };

  const getSignalBars = (signal: number) => {
    const bars = Math.ceil(signal / 25);
    return (
      <div className="flex items-center space-x-1">
        <Signal className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{signal}%</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Network Configuration</h1>
            <p className="text-muted-foreground">Wi-Fi scan, join, and connection management</p>
          </div>
          
          <Button 
            onClick={scanNetworks} 
            disabled={scanning}
            className="bg-gradient-primary text-primary-foreground hover:opacity-90"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'Scanning...' : 'Scan Networks'}
          </Button>
        </div>

        {/* Current Connection */}
        {currentConnection && (
          <Card className="border-secure/20 bg-secure/5">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Wifi className="mr-2 h-5 w-5 text-secure" />
                Current Connection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{currentConnection}</p>
                  <p className="text-sm text-muted-foreground">Connected and secure</p>
                </div>
                <Badge variant="outline" className="border-secure text-secure">
                  <Shield className="mr-1 h-3 w-3" />
                  Connected
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Networks */}
        <Card className="border-border shadow-soft">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <Wifi className="mr-2 h-5 w-5" />
              Available Networks ({networks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scanning ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-muted-foreground">Scanning for networks...</p>
              </div>
            ) : networks.length === 0 ? (
              <div className="text-center py-8">
                <WifiOff className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No networks found</p>
                <p className="text-sm text-muted-foreground mt-2">Click "Scan Networks" to search for available connections</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Network Name</TableHead>
                    <TableHead className="text-muted-foreground">Security</TableHead>
                    <TableHead className="text-muted-foreground">Signal</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {networks.map((network, index) => (
                    <TableRow key={index} className="border-border hover:bg-muted/50">
                      <TableCell className="font-medium text-foreground">{network.ssid}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getSecurityIcon(network.security)}
                          {getSecurityBadge(network.security)}
                        </div>
                      </TableCell>
                      <TableCell>{getSignalBars(network.signal)}</TableCell>
                      <TableCell>
                        {network.connected ? (
                          <Badge variant="outline" className="border-secure text-secure">Connected</Badge>
                        ) : (
                          <Badge variant="outline" className="border-muted text-muted-foreground">Available</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!network.connected && (
                          <Dialog open={joinDialogOpen && selectedNetwork?.ssid === network.ssid} onOpenChange={(open) => {
                            setJoinDialogOpen(open);
                            if (open) {
                              setSelectedNetwork(network);
                            } else {
                              setSelectedNetwork(null);
                              setPassword('');
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="border-border hover:bg-muted">
                                Connect
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md bg-card border-border">
                              <DialogHeader>
                                <DialogTitle className="text-foreground">Connect to {network.ssid}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                {network.security !== 'Open' && (
                                  <div>
                                    <Label htmlFor="password" className="text-foreground">Password</Label>
                                    <Input
                                      id="password"
                                      type="password"
                                      value={password}
                                      onChange={(e) => setPassword(e.target.value)}
                                      placeholder="Enter network password"
                                      className="bg-background border-border"
                                    />
                                  </div>
                                )}
                                
                                <div className="flex items-center space-x-2 text-sm">
                                  {getSecurityIcon(network.security)}
                                  <span className="text-muted-foreground">
                                    {network.security === 'Open' 
                                      ? 'This is an open network (no password required)'
                                      : `This network uses ${network.security} encryption`
                                    }
                                  </span>
                                </div>
                                
                                <Button 
                                  onClick={handleJoinNetwork} 
                                  disabled={connecting || (network.security !== 'Open' && !password)}
                                  className="w-full bg-gradient-primary text-primary-foreground"
                                >
                                  {connecting ? (
                                    <>
                                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                      Connecting...
                                    </>
                                  ) : (
                                    <>
                                      <Wifi className="mr-2 h-4 w-4" />
                                      Connect
                                    </>
                                  )}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
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