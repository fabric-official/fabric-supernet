import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Shield, 
  Wallet, 
  Key, 
  CheckCircle, 
  AlertCircle,
  Settings,
  Globe
} from "lucide-react"

export default function Operations() {
  const [siteSetup, setSiteSetup] = useState({
    siteId: "",
    wallet: "",
    isConfigured: false
  })

  const [setupStep, setSetupStep] = useState<'site' | 'wallet' | 'complete'>('site')

  const handleSiteSetup = () => {
    // Simulate site setup - would call host.git.write('site/site.json')
    if (siteSetup.siteId && siteSetup.wallet) {
      setSiteSetup(prev => ({ ...prev, isConfigured: true }))
      setSetupStep('complete')
      // Would emit SetupDelta here
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Operations Console</h1>
          <p className="text-muted-foreground mt-1">SuperNet Backboard - System Configuration & First-Run Setup</p>
        </div>
        <Badge variant="outline" className="border-tech-glow text-tech-glow">
          <Settings className="w-3 h-3 mr-1" />
          OPS MODE
        </Badge>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-tech border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Shield className="h-5 w-5 text-tech-glow" />
              <Badge variant={siteSetup.isConfigured ? "default" : "secondary"}>
                {siteSetup.isConfigured ? "CONFIGURED" : "PENDING"}
              </Badge>
            </div>
            <CardTitle className="text-foreground">Site Security</CardTitle>
            <CardDescription>Ed25519 keys and site identity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {siteSetup.isConfigured ? "ACTIVE" : "SETUP REQ"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-tech border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Wallet className="h-5 w-5 text-primary" />
              <Badge variant={siteSetup.wallet ? "default" : "secondary"}>
                {siteSetup.wallet ? "BOUND" : "UNBOUND"}
              </Badge>
            </div>
            <CardTitle className="text-foreground">Wallet Binding</CardTitle>
            <CardDescription>Economic identity and licensing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {siteSetup.wallet ? "LINKED" : "NOT SET"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-tech border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Globe className="h-5 w-5 text-accent" />
              <Badge variant="outline" className="border-accent text-accent">
                FABRIC
              </Badge>
            </div>
            <CardTitle className="text-foreground">Network Status</CardTitle>
            <CardDescription>Language Brain & Git sync</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">ONLINE</div>
          </CardContent>
        </Card>
      </div>

      {/* Setup Workflow */}
      {!siteSetup.isConfigured ? (
        <Card className="bg-gradient-tech border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Key className="h-5 w-5" />
              First-Run Setup
            </CardTitle>
            <CardDescription>
              Initialize your Fabric site with secure identity and wallet binding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {setupStep === 'site' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="siteId" className="text-foreground">Site Identifier</Label>
                  <Input
                    id="siteId"
                    placeholder="SITE-001"
                    value={siteSetup.siteId}
                    onChange={(e) => setSiteSetup(prev => ({ ...prev, siteId: e.target.value }))}
                    className="bg-input border-border"
                  />
                </div>
                <Button 
                  onClick={() => setSetupStep('wallet')}
                  disabled={!siteSetup.siteId}
                  className="bg-primary hover:bg-primary/90"
                >
                  Generate Site Keys
                </Button>
              </div>
            )}

            {setupStep === 'wallet' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="wallet" className="text-foreground">Wallet Address</Label>
                  <Input
                    id="wallet"
                    placeholder="0x..."
                    value={siteSetup.wallet}
                    onChange={(e) => setSiteSetup(prev => ({ ...prev, wallet: e.target.value }))}
                    className="bg-input border-border font-mono text-sm"
                  />
                </div>
                <Button 
                  onClick={handleSiteSetup}
                  disabled={!siteSetup.wallet}
                  className="bg-primary hover:bg-primary/90"
                >
                  Complete Setup
                </Button>
              </div>
            )}

            {setupStep === 'complete' && (
              <Alert className="border-tech-glow bg-muted">
                <CheckCircle className="h-4 w-4 text-tech-glow" />
                <AlertDescription className="text-foreground">
                  Site setup complete! Your Fabric node is now configured and ready for operations.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gradient-tech border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <CheckCircle className="h-5 w-5 text-tech-glow" />
              System Ready
            </CardTitle>
            <CardDescription>
              Your Fabric site is configured and operational
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Site ID</Label>
                <div className="font-mono text-sm bg-muted p-2 rounded border">
                  {siteSetup.siteId}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Wallet</Label>
                <div className="font-mono text-sm bg-muted p-2 rounded border truncate">
                  {siteSetup.wallet}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="bg-gradient-tech border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Quick Actions</CardTitle>
          <CardDescription>Common operations and system management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Shield className="h-5 w-5" />
              <span className="text-xs">Security Audit</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Settings className="h-5 w-5" />
              <span className="text-xs">System Config</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Globe className="h-5 w-5" />
              <span className="text-xs">Network Test</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Key className="h-5 w-5" />
              <span className="text-xs">Key Rotation</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}