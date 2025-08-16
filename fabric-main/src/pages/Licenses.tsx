import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  CreditCard, 
  Package, 
  Users, 
  Calendar,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw
} from "lucide-react"

interface License {
  lic_id: string
  pkg: string
  seats: number
  devices: number
  used_seats: number
  exp: string
  status: 'active' | 'expired' | 'revoked'
  org_wallet: string
}

export default function Licenses() {
  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(false)

  // Simulate license fetch - would call licenses.list()
  const fetchLicenses = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Mock license data
    setLicenses([
      {
        lic_id: "LIC-FABRIC-001",
        pkg: "fabric-core",
        seats: 10,
        devices: 4,
        used_seats: 4,
        exp: "2025-12-31T23:59:59Z",
        status: "active",
        org_wallet: "0x1234...abcd"
      },
      {
        lic_id: "LIC-COMPUTE-002", 
        pkg: "fabric-compute",
        seats: 5,
        devices: 3,
        used_seats: 3,
        exp: "2025-06-30T23:59:59Z",
        status: "active",
        org_wallet: "0x1234...abcd"
      },
      {
        lic_id: "LIC-EDGE-003",
        pkg: "fabric-edge",
        seats: 20,
        devices: 8,
        used_seats: 8,
        exp: "2024-12-31T23:59:59Z",
        status: "expired",
        org_wallet: "0x1234...abcd"
      }
    ])
    setLoading(false)
  }

  useEffect(() => {
    fetchLicenses()
  }, [])

  const getStatusIcon = (status: License['status']) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-tech-glow" />
      case 'expired': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'revoked': return <XCircle className="h-4 w-4 text-destructive" />
    }
  }

  const getStatusBadge = (status: License['status']) => {
    switch (status) {
      case 'active': return <Badge className="bg-tech-glow text-background">ACTIVE</Badge>
      case 'expired': return <Badge className="bg-yellow-500 text-background">EXPIRED</Badge>
      case 'revoked': return <Badge variant="destructive">REVOKED</Badge>
    }
  }

  const getUtilizationColor = (used: number, total: number) => {
    const percentage = (used / total) * 100
    if (percentage >= 90) return 'text-destructive'
    if (percentage >= 75) return 'text-yellow-500'
    return 'text-tech-glow'
  }

  const getDaysUntilExpiry = (expiry: string) => {
    const now = new Date()
    const exp = new Date(expiry)
    const diff = exp.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 3600 * 24))
    return days
  }

  const activeLicenses = licenses.filter(l => l.status === 'active')
  const totalSeats = licenses.reduce((sum, l) => sum + l.seats, 0)
  const usedSeats = licenses.reduce((sum, l) => sum + l.used_seats, 0)
  const totalDevices = licenses.reduce((sum, l) => sum + l.devices, 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">License Management</h1>
          <p className="text-muted-foreground mt-1">Package Licenses, Seat Allocation & Usage Monitoring</p>
        </div>
        <Badge variant="outline" className="border-tech-glow text-tech-glow">
          <CreditCard className="w-3 h-3 mr-1" />
          {activeLicenses.length} ACTIVE
        </Badge>
      </div>

      {/* License Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-tech border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-tech-glow" />
              <div className="text-sm text-muted-foreground">Packages</div>
            </div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {licenses.length}
            </div>
            <div className="text-xs text-muted-foreground">
              {activeLicenses.length} active
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-tech border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" />
              <div className="text-sm text-muted-foreground">Total Seats</div>
            </div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {totalSeats}
            </div>
            <div className="text-xs text-muted-foreground">
              {usedSeats} used
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-tech border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <div className="text-sm text-muted-foreground">Devices</div>
            </div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {totalDevices}
            </div>
            <div className="text-xs text-muted-foreground">
              licensed
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-tech border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-yellow-500" />
              <div className="text-sm text-muted-foreground">Utilization</div>
            </div>
            <div className={`text-2xl font-bold mt-1 ${getUtilizationColor(usedSeats, totalSeats)}`}>
              {totalSeats > 0 ? Math.round((usedSeats / totalSeats) * 100) : 0}%
            </div>
            <div className="text-xs text-muted-foreground">
              seat usage
            </div>
          </CardContent>
        </Card>
      </div>

      {/* License List */}
      <Card className="bg-gradient-tech border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Package Licenses</CardTitle>
              <CardDescription>Licensed Fabric packages and seat allocations</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchLicenses}
              disabled={loading}
              className="border-border"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-tech-glow mr-2" />
              <span className="text-muted-foreground">Loading licenses...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {licenses.map((license) => {
                const daysUntilExpiry = getDaysUntilExpiry(license.exp)
                const utilizationPercent = (license.used_seats / license.seats) * 100
                
                return (
                  <div key={license.lic_id} 
                       className="p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-card">
                          <Package className="h-5 w-5 text-foreground" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{license.pkg}</div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {license.lic_id}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(license.status)}
                        {getStatusBadge(license.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Seat Usage</div>
                        <div className={`text-sm font-medium ${getUtilizationColor(license.used_seats, license.seats)}`}>
                          {license.used_seats} / {license.seats}
                        </div>
                        <Progress value={utilizationPercent} className="h-2" />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Licensed Devices</div>
                        <div className="text-sm font-medium text-foreground">
                          {license.devices}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Expires</div>
                        <div className={`text-sm font-medium ${
                          daysUntilExpiry <= 30 ? 'text-destructive' :
                          daysUntilExpiry <= 90 ? 'text-yellow-500' :
                          'text-foreground'
                        }`}>
                          {license.status === 'expired' ? 'EXPIRED' : 
                           daysUntilExpiry <= 0 ? 'Today' :
                           `${daysUntilExpiry} days`}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Wallet</div>
                        <div className="text-sm font-medium text-foreground font-mono">
                          {license.org_wallet}
                        </div>
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