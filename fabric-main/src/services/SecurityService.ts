// Security Service - Ed25519 verification and CRL management
import { CRL } from '@/types/plugin';

export class SecurityService {
  private pinnedKeys: Map<string, Uint8Array> = new Map();
  private crlCache: CRL | null = null;

  constructor() {
    // Initialize with Atomic's pinned Ed25519 public keys
    this.initializePinnedKeys();
  }

  async verifySignature(payload: Uint8Array, signature: Uint8Array, publicKeyId: string): Promise<boolean> {
    try {
      const publicKey = this.pinnedKeys.get(publicKeyId);
      if (!publicKey) {
        throw new Error(`Unknown public key ID: ${publicKeyId}`);
      }

      // In real implementation, use crypto.subtle or ed25519 library
      // For demo purposes, assume verification passes
      console.log(`Verifying signature with key ${publicKeyId}`);
      return true;
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  async getCRL(): Promise<CRL> {
    try {
      // Check cache first
      if (this.crlCache && this.isCRLFresh(this.crlCache)) {
        return this.crlCache;
      }

      // Fetch fresh CRL (in real implementation, from Git repo)
      const crlData = await this.fetchCRLFromGit();
      
      // Verify CRL signature
      const crlPayload = new TextEncoder().encode(JSON.stringify({
        revoked: crlData.revoked,
        updated_at: crlData.updated_at
      }));
      
      const signature = this.hexToUint8Array(crlData.signature);
      const isValid = await this.verifySignature(crlPayload, signature, 'atomic-crl-key');
      
      if (!isValid) {
        throw new Error('CRL signature verification failed');
      }

      this.crlCache = crlData;
      return crlData;
    } catch (error) {
      throw new Error(`Failed to get CRL: ${error}`);
    }
  }

  private initializePinnedKeys(): void {
    // Initialize with Atomic's Ed25519 public keys
    // In real implementation, these would be embedded or loaded from secure storage
    const atomicKey = this.hexToUint8Array('ed25519publickeyhex123456789abcdef...');
    const crlKey = this.hexToUint8Array('ed25519crlkeyhex123456789abcdef...');
    
    this.pinnedKeys.set('atomic-main-key', atomicKey);
    this.pinnedKeys.set('atomic-crl-key', crlKey);
  }

  private async fetchCRLFromGit(): Promise<CRL> {
    // Mock CRL data - in real implementation, read from revocations/CRL.json
    return {
      revoked: ['LIC-789', 'LIC-999'],
      updated_at: new Date().toISOString(),
      signature: 'ed25519signature123456789abcdef...'
    };
  }

  private isCRLFresh(crl: CRL): boolean {
    const crlAge = Date.now() - new Date(crl.updated_at).getTime();
    const maxAge = 15 * 60 * 1000; // 15 minutes
    return crlAge < maxAge;
  }

  private hexToUint8Array(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  // Check if a license is revoked
  async isLicenseRevoked(licenseId: string): Promise<boolean> {
    const crl = await this.getCRL();
    return crl.revoked.includes(licenseId);
  }

  // Terminate agents affected by CRL updates
  async handleCRLUpdate(newCRL: CRL): Promise<void> {
    if (!this.crlCache) return;

    const newlyRevoked = newCRL.revoked.filter(
      id => !this.crlCache!.revoked.includes(id)
    );

    if (newlyRevoked.length > 0) {
      console.log(`CRL update: ${newlyRevoked.length} new revocations`);
      
      // In real implementation: terminate affected exclusive agents
      for (const licId of newlyRevoked) {
        await this.terminateAgentsWithLicense(licId);
      }
    }

    this.crlCache = newCRL;
  }

  private async terminateAgentsWithLicense(licenseId: string): Promise<void> {
    console.log(`Terminating agents using revoked license: ${licenseId}`);
    // Implementation would stop all agents using this license within SLA (â‰¤15 min)
  }
}