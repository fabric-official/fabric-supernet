import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { 
  Wifi, 
  WifiOff, 
  Signal, 
  Lock, 
  Unlock,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Router
} from "lucide-react"

interface WiFiNetwork {
  ssid: string
  signal: number
  secured: boolean
  frequency: string
}

export default function Network() {
  const [networks, setNetworks] = useState<WiFiNetwork[]>([])
  const [scanning, setScanning] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState<string>("")
  const [password, setPassword] = useState("")
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'connecting'>('disconnected')
  const [connectedSSID, setConnectedSSID] = useState<string>("")

  // Simulate WiFi scan - would call runtime.invoke("wifi.scan")
  const scanNetworks = async () => {
    setScanning(true)
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Mock network data
    setNetworks([
      { ssid: "Fabric-Mesh-01", signal: 85, secured: true, frequency: "5GHz" },
      { ssid: "SuperNet-Backbone", signal: 92, secured: true, frequency: "5GHz" },
      { ssid: "Office-WiFi", signal: 67, secured: true, frequency: "2.4GHz" },
      { ssid: "Guest-Network", signal: 45, secured: false, frequency: "2.4GHz" },
      { ssid: "IoT-Devices", signal: 73, secured: true, frequency: "2.4GHz" },
    ])
    setScanning(false)
  }

  // Simulate WiFi connection - would call runtime.invoke("wifi.join", {ssid, psk})
  const connectToNetwork = async () => {
    if (!selectedNetwork) return
    
    setConnecting(true)
    setConnectionStatus('connecting')
    
    // Simulate connection process
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    setConnectionStatus('connected')
    setConnectedSSID(selectedNetwork)
    setConnecting(false)
    setSelectedNetwork("")
    setPassword("")
  }

  useEffect(() => {
    scanNetworks()
  }, [])

  const getSignalIcon = (strength: number) => {
    if (strength >= 75) return <Signal className="h-4 w-4 text-tech-glow" />
    if (strength >= 50) return <Signal className="h-4 w-4 text-accent" />
    return <Signal className="h-4 w-4 text-muted-foreground" />
  }

  const getSignalStrength = (strength: number) => {
    if (strength >= 75) return "Excellent"
    if (strength >= 50) return "Good"
    if (strength >= 25) return "Fair"
    return "Poor"
  }

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
              {scanning ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {scanning ? "Scanning..." : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              {connectionStatus === 'connected' ? (
                <CheckCircle className="h-6 w-6 text-tech-glow" />
              ) : connectionStatus === 'connecting' ? (
                <RefreshCw className="h-6 w-6 text-accent animate-spin" />
              ) : (
                <WifiOff className="h-6 w-6 text-muted-foreground" />
              )}
              <div>
                <div className="font-medium text-foreground">
                  {connectionStatus === 'connected' ? `Connected to ${connectedSSID}` :
                   connectionStatus === 'connecting' ? 'Connecting...' :
                   'Not Connected'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {connectionStatus === 'connected' ? 'Network access active' :
                   connectionStatus === 'connecting' ? 'Establishing connection' :
                   'No active network connection'}
                </div>
              </div>
            </div>
            <Badge 
              variant={connectionStatus === 'connected' ? "default" : "secondary"}
              className={connectionStatus === 'connected' ? "bg-tech-glow text-background" : ""}
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
          <CardDescription>
            Discovered Wi-Fi networks - Select one to establish connection
          </CardDescription>
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
                <div key={index} 
                     className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                       selectedNetwork === network.ssid 
                         ? 'border-primary bg-primary/10' 
                         : 'border-border hover:border-border/50 hover:bg-muted/50'
                     }`}
                     onClick={() => setSelectedNetwork(network.ssid)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getSignalIcon(network.signal)}
                      <div>
                        <div className="font-medium text-foreground">{network.ssid}</div>
                        <div className="text-sm text-muted-foreground">
                          {getSignalStrength(network.signal)} • {network.frequency}
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connection Form */}
      {selectedNetwork && (
        <Card className="bg-gradient-tech border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Connect to {selectedNetwork}</CardTitle>
            <CardDescription>
              Enter network credentials to establish connection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {networks.find(n => n.ssid === selectedNetwork)?.secured && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Network Password</Label>
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
                disabled={connecting || (networks.find(n => n.ssid === selectedNetwork)?.secured && !password)}
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
                  setSelectedNetwork("")
                  setPassword("")
                }}
                className="border-border"
              >
                Cancel
              </Button>
            </div>

            {!networks.find(n => n.ssid === selectedNetwork)?.secured && (
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
  )
}