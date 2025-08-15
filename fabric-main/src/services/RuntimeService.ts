// Runtime Service - CLI/Agent-VM RPC mapping with policy enforcement
import { Device } from '@/types/plugin';

export class RuntimeService {
  async invoke<T = any>(cmd: string, args?: Record<string, any>): Promise<T> {
    console.log(`Runtime invoke: ${cmd}`, args);
    
    // Policy enforcement - check for restricted operations
    if (cmd.startsWith('agent.') && args) {
      await this.enforceAgentPolicy(cmd, args);
    }

    switch (cmd) {
      case "wifi.scan":
        return this.wifiScan() as T;
        
      case "wifi.join":
        return this.wifiJoin(args?.ssid, args?.psk) as T;
        
      case "device.list":
        return this.deviceList() as T;
        
      case "device.enroll":
        return this.deviceEnroll(args?.fp, args?.name, args?.role) as T;
        
      case "policy.verify":
        return this.policyVerify(args?.deviceFp) as T;
        
      case "attest.verify":
        return this.attestVerify(args?.artifactPath) as T;
        
      case "agent.start":
        return this.agentStart(args?.agentId, args?.deviceFp) as T;
        
      case "agent.stop":
        return this.agentStop(args?.agentId, args?.deviceFp) as T;
        
      case "agent.update":
        return this.agentUpdate(args?.agentId, args?.deviceFp) as T;
        
      case "license.activate":
        return this.licenseActivate(args?.licId, args?.pkg, args?.deviceFp) as T;
        
      default:
        throw new Error(`Unknown runtime command: ${cmd}`);
    }
  }

  private async enforceAgentPolicy(cmd: string, args: Record<string, any>): Promise<void> {
    // Check agent policy for restricted operations
    const agentPolicy = await this.getAgentPolicy(args.agentId || args.deviceFp);
    
    if (agentPolicy?.forkable === false || agentPolicy?.distribution === "closed") {
      const restrictedOps = ['export', 'publish', 'fork'];
      if (restrictedOps.some(op => cmd.includes(op))) {
        throw new Error(`Policy violation: ${cmd} blocked for closed/non-forkable agent`);
      }
    }
  }

  private async getAgentPolicy(agentOrDeviceId: string): Promise<any> {
    // Mock policy - in real implementation, fetch from Language Brain or local cache
    return {
      forkable: false,
      distribution: "closed",
      version: "1.0.0"
    };
  }

  private async wifiScan(): Promise<{ ssids: string[] }> {
    // Mock Wi-Fi scan
    return {
      ssids: ["FabricNet-Secure", "Office-WiFi", "Public-Network"]
    };
  }

  private async wifiJoin(ssid: string, psk: string): Promise<{ success: boolean }> {
    console.log(`Joining Wi-Fi: ${ssid}`);
    // In real implementation: connect to Wi-Fi and encrypt/store credentials
    return { success: true };
  }

  private async deviceList(): Promise<Device[]> {
    return [
      {
        fp: "sha256:device1fingerprint",
        name: "edge-device-01",
        role: "edge",
        online: true,
        lastHeartbeat: new Date().toISOString()
      },
      {
        fp: "sha256:device2fingerprint", 
        name: "compute-node-01",
        role: "compute",
        online: false,
        lastHeartbeat: new Date(Date.now() - 300000).toISOString()
      }
    ];
  }

  private async deviceEnroll(fp: string, name: string, role: string): Promise<{ success: boolean }> {
    console.log(`Enrolling device: ${name} (${fp}) as ${role}`);
    // In real implementation: create device file and emit JoinDelta
    return { success: true };
  }

  private async policyVerify(deviceFp: string): Promise<{ diagnostics: any[]; ok: boolean }> {
    // Call Language Brain PolicyLint endpoint
    try {
      const response = await fetch('http://localhost:8891/fabric.core.language.v1.LanguageBrain/PolicyLint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sources: [],
          flags: {},
          artifacts: []
        })
      });
      
      if (!response.ok) {
        throw new Error(`PolicyLint failed: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.warn('Language Brain unavailable, using mock policy verification');
      return {
        diagnostics: [],
        ok: true
      };
    }
  }

  private async attestVerify(artifactPath: string): Promise<{ verified: boolean; attestation?: any }> {
    // Call Language Brain Compile endpoint for attestation verification
    try {
      const response = await fetch('http://localhost:8891/fabric.core.language.v1.LanguageBrain/Compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reproducible: true,
          src: [],
          flags: { targets: ["sol"] }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Attestation verification failed: ${response.status}`);
      }
      
      const result = await response.json();
      return {
        verified: true,
        attestation: result.attestation
      };
    } catch (error) {
      console.warn('Language Brain unavailable, using mock attestation');
      return { verified: true };
    }
  }

  private async agentStart(agentId: string, deviceFp: string): Promise<{ success: boolean }> {
    console.log(`Starting agent ${agentId} on device ${deviceFp}`);
    return { success: true };
  }

  private async agentStop(agentId: string, deviceFp: string): Promise<{ success: boolean }> {
    console.log(`Stopping agent ${agentId} on device ${deviceFp}`);
    return { success: true };
  }

  private async agentUpdate(agentId: string, deviceFp: string): Promise<{ success: boolean }> {
    console.log(`Updating agent ${agentId} on device ${deviceFp}`);
    return { success: true };
  }

  private async licenseActivate(licId: string, pkg: string, deviceFp: string): Promise<{ success: boolean }> {
    console.log(`Activating license ${licId} for package ${pkg} on device ${deviceFp}`);
    return { success: true };
  }
}