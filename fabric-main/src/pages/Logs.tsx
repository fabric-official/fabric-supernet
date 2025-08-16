import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  FileText, 
  Download, 
  Filter,
  Calendar,
  Clock,
  User,
  Shield,
  RefreshCw
} from "lucide-react"

interface ProvenanceDelta {
  type: string
  ts: string
  siteId: string
  payload: Record<string, any>
  sig: string
  pubkey: string
}

export default function Logs() {
  const [logs, setLogs] = useState<ProvenanceDelta[]>([])
  const [loading, setLoading] = useState(false)
  const [filterType, setFilterType] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("today")

  // Simulate log fetch - would call git.read('audit/YYYY-MM-DD.ndjson')
  const fetchLogs = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Mock provenance data
    setLogs([
      {
        type: "SetupDelta",
        ts: "2025-01-14T10:30:00Z",
        siteId: "SITE-001",
        payload: { siteVersion: "1.0", wallet: "0x1234...abcd" },
        sig: "ed25519:a1b2c3...",
        pubkey: "key-001"
      },
      {
        type: "JoinDelta", 
        ts: "2025-01-14T11:15:00Z",
        siteId: "SITE-001",
        payload: { deviceFp: "sha256:a1b2...", name: "edge-node-01", role: "edge" },
        sig: "ed25519:b2c3d4...",
        pubkey: "key-001"
      },
      {
        type: "LicenseBoundDelta",
        ts: "2025-01-14T11:30:00Z", 
        siteId: "SITE-001",
        payload: { lic_id: "LIC-FABRIC-001", deviceFp: "sha256:a1b2...", pkg: "fabric-core" },
        sig: "ed25519:c3d4e5...",
        pubkey: "key-001"
      },
      {
        type: "AgentStartDelta",
        ts: "2025-01-14T12:00:00Z",
        siteId: "SITE-001", 
        payload: { agentId: "agent-001", deviceFp: "sha256:a1b2..." },
        sig: "ed25519:d4e5f6...",
        pubkey: "key-001"
      },
      {
        type: "PolicyViolationDelta",
        ts: "2025-01-14T12:45:00Z",
        siteId: "SITE-001",
        payload: { deviceFp: "sha256:c3d4...", diagnostics: ["forbidden export directive"] },
        sig: "ed25519:e5f6g7...",
        pubkey: "key-001"
      }
    ])
    setLoading(false)
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SetupDelta': return <Shield className="h-4 w-4 text-tech-glow" />
      case 'JoinDelta': return <User className="h-4 w-4 text-accent" />
      case 'LicenseBoundDelta': return <FileText className="h-4 w-4 text-primary" />
      case 'AgentStartDelta': 
      case 'AgentStopDelta': return <Calendar className="h-4 w-4 text-yellow-500" />
      case 'PolicyViolationDelta': return <Shield className="h-4 w-4 text-destructive" />
      default: return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'SetupDelta': return <Badge className="bg-tech-glow text-background">SETUP</Badge>
      case 'JoinDelta': return <Badge className="bg-accent text-background">JOIN</Badge>
      case 'LicenseBoundDelta': return <Badge className="bg-primary text-primary-foreground">LICENSE</Badge>
      case 'AgentStartDelta': return <Badge className="bg-yellow-500 text-background">START</Badge>
      case 'AgentStopDelta': return <Badge variant="secondary">STOP</Badge>
      case 'PolicyViolationDelta': return <Badge variant="destructive">VIOLATION</Badge>
      default: return <Badge variant="outline">{type.replace('Delta', '').toUpperCase()}</Badge>
    }
  }

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    }
  }

  const getTypeDescription = (delta: ProvenanceDelta) => {
    switch (delta.type) {
      case 'SetupDelta':
        return `Site initialized with wallet ${delta.payload.wallet}`
      case 'JoinDelta':
        return `Device ${delta.payload.name} joined as ${delta.payload.role}`
      case 'LicenseBoundDelta':
        return `License ${delta.payload.lic_id} bound to device`
      case 'AgentStartDelta':
        return `Agent ${delta.payload.agentId} started`
      case 'AgentStopDelta':
        return `Agent ${delta.payload.agentId} stopped`
      case 'PolicyViolationDelta':
        return `Policy violation: ${delta.payload.diagnostics?.join(', ')}`
      default:
        return `${delta.type} event recorded`
    }
  }

  const filteredLogs = logs.filter(log => {
    if (filterType === "all") return true
    return log.type === filterType
  })

  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `fabric-audit-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Provenance Logs</h1>
          <p className="text-muted-foreground mt-1">Audit Trail & System Event History</p>
        </div>
        <Badge variant="outline" className="border-tech-glow text-tech-glow">
          <FileText className="w-3 h-3 mr-1" />
          {filteredLogs.length} EVENTS
        </Badge>
      </div>

      {/* Log Controls */}
      <Card className="bg-gradient-tech border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Audit Controls</CardTitle>
              <CardDescription>Filter, export and manage audit logs</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={exportLogs}
                className="border-border"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchLogs}
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48 bg-input border-border">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="SetupDelta">Setup</SelectItem>
                  <SelectItem value="JoinDelta">Device Join</SelectItem>
                  <SelectItem value="LicenseBoundDelta">License Binding</SelectItem>
                  <SelectItem value="AgentStartDelta">Agent Start</SelectItem>
                  <SelectItem value="AgentStopDelta">Agent Stop</SelectItem>
                  <SelectItem value="PolicyViolationDelta">Policy Violations</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-32 bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Timeline */}
      <Card className="bg-gradient-tech border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Event Timeline</CardTitle>
          <CardDescription>
            Chronological audit trail of all Fabric operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-tech-glow mr-2" />
              <span className="text-muted-foreground">Loading audit logs...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((delta, index) => {
                const { date, time } = formatTimestamp(delta.ts)
                return (
                  <div key={index} 
                       className="flex gap-4 p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col items-center">
                      {getTypeIcon(delta.type)}
                      {index < filteredLogs.length - 1 && (
                        <div className="w-px h-8 bg-border mt-2"></div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getTypeBadge(delta.type)}
                        <div className="text-sm text-muted-foreground">{date} at {time}</div>
                        <code className="text-xs bg-card px-2 py-1 rounded text-muted-foreground">
                          {delta.siteId}
                        </code>
                      </div>
                      
                      <div className="text-sm text-foreground mb-2">
                        {getTypeDescription(delta)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <div className="text-muted-foreground">Signature</div>
                          <div className="font-mono bg-card p-2 rounded border truncate">
                            {delta.sig}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-muted-foreground">Public Key</div>
                          <div className="font-mono bg-card p-2 rounded border">
                            {delta.pubkey}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {filteredLogs.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <div className="text-foreground font-medium">No Events Found</div>
                  <div className="text-muted-foreground text-sm">
                    No audit events match the current filters
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}