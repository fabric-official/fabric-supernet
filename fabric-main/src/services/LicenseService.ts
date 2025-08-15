// License Service - License management and seat binding
import { License } from '@/types/plugin';

export class LicenseService {
  constructor(
    private gitService: any, // Will be properly typed when imported
    private securityService: any
  ) {}

  async list(): Promise<Array<{ lic_id: string; pkg: string; seats: number; devices: number }>> {
    try {
      // List all license files from Git
      const licenseFiles = await this.gitService.list('licenses');
      const licenses: Array<{ lic_id: string; pkg: string; seats: number; devices: number }> = [];

      for (const file of licenseFiles) {
        if (file.endsWith('.json.age')) {
          const license = await this.loadLicense(file);
          if (license) {
            const boundDevices = await this.countBoundDevices(license.lic_id);
            licenses.push({
              lic_id: license.lic_id,
              pkg: license.pkg,
              seats: license.seats,
              devices: boundDevices
            });
          }
        }
      }

      return licenses;
    } catch (error) {
      console.error('Failed to list licenses:', error);
      return [];
    }
  }

  async loadLicense(filename: string): Promise<License | null> {
    try {
      // In real implementation: decrypt .age file and verify COSE/JWS signature
      const encryptedData = await this.gitService.read(`licenses/${filename}`);
      
      // Mock decryption - in real implementation use age decryption
      const licenseData = this.mockDecryptLicense(encryptedData);
      
      // Verify signature
      const isValid = await this.verifyLicenseSignature(licenseData);
      if (!isValid) {
        throw new Error(`Invalid license signature: ${filename}`);
      }

      return licenseData;
    } catch (error) {
      console.error(`Failed to load license ${filename}:`, error);
      return null;
    }
  }

  async bindSeat(licenseId: string, deviceFp: string, pkg: string): Promise<void> {
    try {
      // Check license validity and available seats
      const license = await this.loadLicense(`${licenseId}.json.age`);
      if (!license) {
        throw new Error(`License not found: ${licenseId}`);
      }

      // Check if license is revoked
      const isRevoked = await this.securityService.isLicenseRevoked(licenseId);
      if (isRevoked) {
        throw new Error(`License revoked: ${licenseId}`);
      }

      // Check available seats
      const boundDevices = await this.countBoundDevices(licenseId);
      if (boundDevices >= license.seats) {
        throw new Error(`No available seats for license: ${licenseId}`);
      }

      // Create seat claim
      const seatClaim = {
        lic_id: licenseId,
        device_fp: deviceFp,
        pkg: pkg,
        bound_at: new Date().toISOString(),
        signature: 'device-signature' // In real implementation: sign with device key
      };

      // Write seat claim file
      const seatPath = `seats/${licenseId}/${deviceFp}.claim`;
      await this.gitService.write(seatPath, JSON.stringify(seatClaim, null, 2));

    } catch (error) {
      throw new Error(`Failed to bind seat: ${error}`);
    }
  }

  async countBoundDevices(licenseId: string): Promise<number> {
    try {
      const seatDir = `seats/${licenseId}`;
      const exists = await this.gitService.exists(seatDir);
      if (!exists) return 0;

      const seatFiles = await this.gitService.list(seatDir);
      return seatFiles.filter(f => f.endsWith('.claim')).length;
    } catch {
      return 0;
    }
  }

  private mockDecryptLicense(encryptedData: string): License {
    // Mock license data - in real implementation: decrypt age file
    return {
      lic_id: 'LIC-123',
      pkg: 'fabric-agent-core',
      agents: ['agent-1', 'agent-2'],
      seats: 10,
      org_wallet: 'org-wallet-address',
      exp: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      watermark_id: 'watermark-123',
      nonce: 'random-nonce',
      sig: 'license-signature'
    };
  }

  private async verifyLicenseSignature(license: License): Promise<boolean> {
    // In real implementation: verify COSE/JWS signature
    return true;
  }

  async isLicenseValid(licenseId: string): Promise<boolean> {
    try {
      const license = await this.loadLicense(`${licenseId}.json.age`);
      if (!license) return false;

      // Check expiration
      if (new Date(license.exp) < new Date()) {
        return false;
      }

      // Check if revoked
      const isRevoked = await this.securityService.isLicenseRevoked(licenseId);
      return !isRevoked;
    } catch {
      return false;
    }
  }
}