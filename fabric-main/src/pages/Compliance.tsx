import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  FileCheck,
  Key,
  Lock
} from "lucide-react"

interface PolicyDiagnostic {
  severity: 'error' | 'warning' | 'info'
  message: string
  deviceFp?: string
  ruleId: string
}

interface CRLInfo {
  revoked: string[]
  updatedAt: string
  count: number
}

export default function Compliance() {
  const [scanning, setScanning] = useState(false)
  const [diagnostics, setDiagnostics] = useState<PolicyDiagnostic[]>([])
  const [crlInfo, setCrlInfo] = useState<CRLInfo | null>(null)
  const [complianceScore, setComplianceScore] = useState(0)

  // Simulate policy verification - would call runtime.invoke("policy.verify", {deviceFp})
  const runComplianceScan = async () => {
    setScanning(true)
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Mock diagnostics data
    setDiagnostics([
      {
        severity: 'warning',
        message: 'Device edge-node-01 has outdated attestation signature',
        deviceFp: 'sha256:a1b2c3d4e5f6...',
        ruleId: 'ATTEST_001'
      },
      {
        severity: 'info', 
        message: 'All devices have valid license bindings',
        ruleId: 'LICENSE_001'
      },
      {
        severity: 'error',
        message: 'Device sensor-array-02 policy contains forbidden export directive',
        deviceFp: 'sha256:c3d4e5f6789...',
        ruleId: 'POLICY_EXPORT'
      }
    ])

    // Calculate compliance score
    const errors = diagnostics.filter(d => d.severity === 'error').length
    const warnings = diagnostics.filter(d => d.severity === 'warning').length
    const total = diagnostics.length
    const score = total > 0 ? Math.max(0, 100 - (errors * 30) - (warnings * 10)) : 100
    setComplianceScore(score)
    
    setScanning(false)
  }

  // Simulate CRL fetch - would call security.getCRL()
  const fetchCRL = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setCrlInfo({
      revoked: ['LIC-123', 'LIC-456'],
      updatedAt: new Date().toISOString(),
      count: 2
    })
  }

  useEffect(() => {
    runComplianceScan()
    fetchCRL()
  }, [])

  const getSeverityIcon = (severity: PolicyDiagnostic['severity']) => {
    switch (severity) {
      case 'error': return <XCircle className="h-4 w-4 text-destructive" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info': return <CheckCircle className="h-4 w-4 text-tech-glow" />
    }
  }

  const getSeverityBadge = (severity: PolicyDiagnostic['severity']) => {
    switch (severity) {
      case 'error': return <Badge variant="destructive">ERROR</Badge>
      case 'warning': return <Badge className="bg-yellow-500 text-background">WARNING</Badge>
      case 'info': return <Badge className="bg-tech-glow text-background">INFO</Badge>
    }
  }

  const getComplianceColor = (score: number) => {
    if (score >= 80) return 'text-tech-glow'
    if (score >= 60) return 'text-yellow-500'
    return 'text-destructive'
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Compliance & Policy</h1>
          <p className="text-muted-foreground mt-1">Policy Verification, CRL Management & Security Compliance</p>
        </div>
        <Badge variant="outline" className="border-tech-glow text-tech-glow">
          <Shield className="w-3 h-3 mr-1" />
          COMPLIANCE
        </Badge>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-tech border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Shield className="h-5 w-5 text-tech-glow" />
              <Badge variant="outline" className="border-tech-glow text-tech-glow">
                SCORE
              </Badge>
            </div>
            <CardTitle className="text-foreground">Compliance Score</CardTitle>
            <CardDescription>Overall policy compliance rating</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getComplianceColor(complianceScore)}`}>
              {complianceScore}%
            </div>
            <Progress value={complianceScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-tech border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <FileCheck className="h-5 w-5 text-accent" />
              <Badge variant="outline" className="border-accent text-accent">
                ACTIVE
              </Badge>
            </div>
            <CardTitle className="text-foreground">Policy Checks</CardTitle>
            <CardDescription>Active verification rules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">12</div>
            <div className="text-sm text-muted-foreground mt-1">Last scan: 2 minutes ago</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-tech border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Key className="h-5 w-5 text-primary" />
              <Badge variant={crlInfo && crlInfo.count > 0 ? "destructive" : "outline"}>
                {crlInfo ? crlInfo.count : 0}
              </Badge>
            </div>
            <CardTitle className="text-foreground">Revoked Licenses</CardTitle>
            <CardDescription>Certificate revocation list</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {crlInfo ? crlInfo.count : '-'}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {crlInfo ? `Updated: ${new Date(crlInfo.updatedAt).toLocaleTimeString()}` : 'Loading...'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Policy Diagnostics */}
      <Card className="bg-gradient-tech border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Policy Diagnostics</CardTitle>
              <CardDescription>Language Brain policy verification results</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={runComplianceScan}
              disabled={scanning}
              className="border-border"
            >
              {scanning ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {scanning ? "Scanning..." : "Run Scan"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {scanning ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-tech-glow mr-2" />
              <span className="text-muted-foreground">Running policy verification...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {diagnostics.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-tech-glow mx-auto mb-3" />
                  <div className="text-foreground font-medium">All Policies Compliant</div>
                  <div className="text-muted-foreground text-sm">No policy violations detected</div>
                </div>
              ) : (
                diagnostics.map((diagnostic, index) => (
                  <div key={index} 
                       className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30"
                  >
                    {getSeverityIcon(diagnostic.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getSeverityBadge(diagnostic.severity)}
                        <code className="text-xs bg-card px-2 py-1 rounded text-muted-foreground">
                          {diagnostic.ruleId}
                        </code>
                      </div>
                      <div className="text-sm text-foreground">{diagnostic.message}</div>
                      {diagnostic.deviceFp && (
                        <div className="text-xs text-muted-foreground mt-1 font-mono">
                          Device: {diagnostic.deviceFp}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CRL Status */}
      <Card className="bg-gradient-tech border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Lock className="h-5 w-5" />
            Certificate Revocation List
          </CardTitle>
          <CardDescription>
            Revoked licenses and certificates - automatically enforced
          </CardDescription>
        </CardHeader>
        <CardContent>
          {crlInfo ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Total Revoked</div>
                  <div className="text-2xl font-bold text-foreground">{crlInfo.count}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Last Updated</div>
                  <div className="text-sm font-medium text-foreground">
                    {new Date(crlInfo.updatedAt).toLocaleString()}
                  </div>
                </div>
              </div>
              
              {crlInfo.revoked.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-foreground">Revoked Licenses</div>
                  <div className="space-y-1">
                    {crlInfo.revoked.map((licenseId, index) => (
                      <div key={index} 
                           className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded"
                      >
                        <XCircle className="h-4 w-4 text-destructive" />
                        <code className="text-sm font-mono text-foreground">{licenseId}</code>
                        <Badge variant="destructive" className="ml-auto">REVOKED</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {crlInfo.count === 0 && (
                <Alert className="border-tech-glow/30 bg-tech-glow/10">
                  <CheckCircle className="h-4 w-4 text-tech-glow" />
                  <AlertDescription className="text-foreground">
                    No revoked certificates. All licenses are valid and active.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-tech-glow mr-2" />
              <span className="text-muted-foreground">Loading CRL data...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}