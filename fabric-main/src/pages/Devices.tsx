import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { 
  Monitor, 
  Smartphone, 
  Server, 
  Router,
  Plus,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle
} from "lucide-react"

interface Device {
  fp: string
  name: string
  role: 'edge' | 'gateway' | 'sensor' | 'compute'
  online: boolean
  lastHeartbeat: string
  enrolledAt: string
  pubkey?: string
}

export default function Devices() {
  const [devices, setDevices] = useState<Device[]>([])
  const [discovering, setDiscovering] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false)
  const [newDevice, setNewDevice] = useState({
    fp: "",
    name: "",
    role: "" as Device['role']
  })

  // Simulate device discovery - would call runtime.invoke("device.list")
  const discoverDevices = async () => {
    setDiscovering(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Mock device data
    setDevices([
      {
        fp: "sha256:a1b2c3d4e5f6789012345678901234567890abcdef",
        name: "Edge-Node-01",
        role: "edge",
        online: true,
        lastHeartbeat: new Date(Date.now() - 30000).toISOString(),
        enrolledAt: "2025-01-10T08:30:00Z"
      },
      {
        fp: "sha256:b2c3d4e5f6789012345678901234567890abcdef01",
        name: "Gateway-Alpha",
        role: "gateway", 
        online: true,
        lastHeartbeat: new Date(Date.now() - 45000).toISOString(),
        enrolledAt: "2025-01-10T09:15:00Z"
      },
      {
        fp: "sha256:c3d4e5f6789012345678901234567890abcdef012",
        name: "Sensor-Array-02",
        role: "sensor",
        online: false,
        lastHeartbeat: new Date(Date.now() - 300000).toISOString(),
        enrolledAt: "2025-01-09T14:22:00Z"
      },
      {
        fp: "sha256:d4e5f6789012345678901234567890abcdef0123",
        name: "Compute-Cluster",
        role: "compute",
        online: true,
        lastHeartbeat: new Date(Date.now() - 15000).toISOString(),
        enrolledAt: "2025-01-10T10:45:00Z"
      }
    ])
    setDiscovering(false)
  }

  // Simulate device enrollment - would call runtime.invoke("device.enroll", {fp, name, role})
  const enrollDevice = async () => {
    if (!newDevice.fp || !newDevice.name || !newDevice.role) return
    
    setEnrolling(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const enrolledDevice: Device = {
      ...newDevice,
      online: true,
      lastHeartbeat: new Date().toISOString(),
      enrolledAt: new Date().toISOString()
    }
    
    setDevices(prev => [...prev, enrolledDevice])
    setEnrolling(false)
    setEnrollDialogOpen(false)
    setNewDevice({ fp: "", name: "", role: "" as Device['role'] })
    // Would emit JoinDelta here
  }

  useEffect(() => {
    discoverDevices()
  }, [])

  const getDeviceIcon = (role: Device['role']) => {
    switch (role) {
      case 'edge': return Monitor
      case 'gateway': return Router
      case 'sensor': return Smartphone
      case 'compute': return Server
      default: return Monitor
    }
  }

  const getStatusBadge = (device: Device) => {
    if (device.online) {
      return <Badge className="bg-tech-glow text-background">ONLINE</Badge>
    }
    return <Badge variant="destructive">OFFLINE</Badge>
  }

  const getLastSeen = (heartbeat: string) => {
    const diff = Date.now() - new Date(heartbeat).getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return `${seconds}s ago`
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Device Management</h1>
          <p className="text-muted-foreground mt-1">Device Discovery, Enrollment & Health Monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-tech-glow text-tech-glow">
            <Monitor className="w-3 h-3 mr-1" />
            {devices.length} DEVICES
          </Badge>
          <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Enroll Device
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Enroll New Device</DialogTitle>
                <DialogDescription>
                  Add a new device to the Fabric network
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Device Fingerprint</Label>
                  <Input
                    placeholder="sha256:..."
                    value={newDevice.fp}
                    onChange={(e) => setNewDevice(prev => ({ ...prev, fp: e.target.value }))}
                    className="bg-input border-border font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Device Name</Label>
                  <Input
                    placeholder="edge-node-03"
                    value={newDevice.name}
                    onChange={(e) => setNewDevice(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Device Role</Label>
                  <Select value={newDevice.role} onValueChange={(value: Device['role']) => 
                    setNewDevice(prev => ({ ...prev, role: value }))
                  }>
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
                
                <div className="flex gap-3">
                  <Button 
                    onClick={enrollDevice}
                    disabled={enrolling || !newDevice.fp || !newDevice.name || !newDevice.role}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {enrolling ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    {enrolling ? "Enrolling..." : "Enroll Device"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setEnrollDialogOpen(false)
                      setNewDevice({ fp: "", name: "", role: "" as Device['role'] })
                    }}
                    className="border-border"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Device Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-tech border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-tech-glow" />
              <div className="text-sm text-muted-foreground">Online</div>
            </div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {devices.filter(d => d.online).length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-tech border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <div className="text-sm text-muted-foreground">Offline</div>
            </div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {devices.filter(d => !d.online).length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-tech border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Router className="h-4 w-4 text-accent" />
              <div className="text-sm text-muted-foreground">Gateways</div>
            </div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {devices.filter(d => d.role === 'gateway').length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-tech border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-primary" />
              <div className="text-sm text-muted-foreground">Edge</div>
            </div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {devices.filter(d => d.role === 'edge').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device List */}
      <Card className="bg-gradient-tech border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Enrolled Devices</CardTitle>
              <CardDescription>Fabric network device registry</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={discoverDevices}
              disabled={discovering}
              className="border-border"
            >
              {discovering ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {discovering ? "Discovering..." : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {discovering && devices.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-tech-glow mr-2" />
              <span className="text-muted-foreground">Discovering devices...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {devices.map((device) => {
                const DeviceIcon = getDeviceIcon(device.role)
                return (
                  <div key={device.fp} 
                       className="p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-card">
                          <DeviceIcon className="h-6 w-6 text-foreground" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{device.name}</div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {device.fp.substring(0, 32)}...
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Role: {device.role} • Enrolled: {new Date(device.enrolledAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Last seen</div>
                          <div className="text-sm font-medium text-foreground">
                            {getLastSeen(device.lastHeartbeat)}
                          </div>
                        </div>
                        {getStatusBadge(device)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}