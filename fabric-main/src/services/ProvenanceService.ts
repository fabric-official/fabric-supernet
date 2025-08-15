// Provenance Service - Append-only signed delta logging
import { ProvenanceDelta } from '@/types/plugin';

export class ProvenanceService {
  constructor(
    private gitService: any,
    private securityService: any
  ) {}

  async emit(delta: ProvenanceDelta): Promise<void> {
    try {
      // Add timestamp and site information
      const enrichedDelta = {
        ...delta,
        ts: new Date().toISOString(),
        siteId: await this.getSiteId()
      };

      // Sign the delta
      const signedDelta = await this.signDelta(enrichedDelta);

      // Append to today's audit log
      const today = new Date().toISOString().split('T')[0];
      const auditFile = `audit/${today}.ndjson`;
      
      // Read existing content or create new
      let existingContent = '';
      try {
        existingContent = await this.gitService.read(auditFile);
      } catch {
        // File doesn't exist yet, that's OK
      }

      // Append new delta (NDJSON format)
      const newContent = existingContent + JSON.stringify(signedDelta) + '\n';
      
      // Write atomically
      await this.gitService.write(auditFile, newContent, `feat(audit): +1 ${delta.type}`);
      
      console.log(`Emitted ${delta.type} to provenance log`);
    } catch (error) {
      throw new Error(`Failed to emit provenance delta: ${error}`);
    }
  }

  async readAuditLog(date?: string): Promise<ProvenanceDelta[]> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const auditFile = `audit/${targetDate}.ndjson`;
      
      const content = await this.gitService.read(auditFile);
      const lines = content.trim().split('\n').filter(line => line.length > 0);
      
      const deltas: ProvenanceDelta[] = [];
      for (const line of lines) {
        try {
          const delta = JSON.parse(line);
          
          // Verify signature
          const isValid = await this.verifyDeltaSignature(delta);
          if (isValid) {
            deltas.push(delta);
          } else {
            console.warn(`Invalid signature in audit log: ${line}`);
          }
        } catch (parseError) {
          console.warn(`Failed to parse audit log line: ${line}`);
        }
      }
      
      return deltas;
    } catch (error) {
      console.error(`Failed to read audit log for ${date}:`, error);
      return [];
    }
  }

  async exportAuditLogs(startDate: string, endDate: string): Promise<string> {
    try {
      const auditFiles = await this.gitService.list('audit');
      const relevantFiles = auditFiles.filter(file => {
        const fileDate = file.replace('.ndjson', '');
        return fileDate >= startDate && fileDate <= endDate;
      });

      let allDeltas = '';
      for (const file of relevantFiles) {
        const content = await this.gitService.read(`audit/${file}`);
        allDeltas += content;
      }

      return allDeltas;
    } catch (error) {
      throw new Error(`Failed to export audit logs: ${error}`);
    }
  }

  private async getSiteId(): Promise<string> {
    try {
      const siteConfig = await this.gitService.read('site/site.json');
      const config = JSON.parse(siteConfig);
      return config.siteId || 'UNKNOWN-SITE';
    } catch {
      return 'UNKNOWN-SITE';
    }
  }

  private async signDelta(delta: Omit<ProvenanceDelta, 'sig' | 'pubkey'>): Promise<ProvenanceDelta> {
    // In real implementation: sign with site's Ed25519 private key
    const payload = JSON.stringify({
      type: delta.type,
      ts: delta.ts,
      siteId: delta.siteId,
      ...('deviceFp' in delta ? { deviceFp: delta.deviceFp } : {}),
      payload: delta.payload
    });

    // Mock signature - in real implementation use Ed25519 signing
    const signature = await this.mockSign(payload);
    
    return {
      ...delta,
      sig: signature,
      pubkey: 'site-ed25519-key-id'
    } as ProvenanceDelta;
  }

  private async verifyDeltaSignature(delta: ProvenanceDelta): Promise<boolean> {
    try {
      const payload = JSON.stringify({
        type: delta.type,
        ts: delta.ts,
        siteId: delta.siteId,
        ...('deviceFp' in delta ? { deviceFp: delta.deviceFp } : {}),
        payload: delta.payload
      });

      const payloadBytes = new TextEncoder().encode(payload);
      const signatureBytes = this.hexToUint8Array(delta.sig);
      
      return await this.securityService.verifySignature(
        payloadBytes,
        signatureBytes,
        delta.pubkey
      );
    } catch (error) {
      console.error('Delta signature verification failed:', error);
      return false;
    }
  }

  private async mockSign(payload: string): Promise<string> {
    // Mock Ed25519 signature - in real implementation use crypto
    return 'ed25519signature' + Buffer.from(payload).toString('base64').slice(0, 32);
  }

  private hexToUint8Array(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  // Helper methods for specific delta types
  async emitSetupDelta(siteVersion: string, wallet: string): Promise<void> {
    await this.emit({
      type: 'SetupDelta',
      payload: { siteVersion, wallet }
    } as any);
  }

  async emitJoinDelta(deviceFp: string, name: string, role: string): Promise<void> {
    await this.emit({
      type: 'JoinDelta',
      deviceFp,
      payload: { name, role }
    } as any);
  }

  async emitLicenseBoundDelta(licId: string, deviceFp: string, pkg: string): Promise<void> {
    await this.emit({
      type: 'LicenseBoundDelta',
      payload: { lic_id: licId, deviceFp, pkg }
    } as any);
  }

  async emitPolicyViolationDelta(deviceFp: string, diagnostics: any[]): Promise<void> {
    await this.emit({
      type: 'PolicyViolationDelta',
      deviceFp,
      payload: { diagnostics }
    } as any);
  }

  async emitCRLUpdateDelta(count: number): Promise<void> {
    await this.emit({
      type: 'CRLUpdateDelta',
      payload: { count }
    } as any);
  }
}