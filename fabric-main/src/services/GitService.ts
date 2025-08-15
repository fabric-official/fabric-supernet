// Git Service - Git-backed state management with atomic operations
import { SiteConfig, Device, License, CRL } from '@/types/plugin';

export class GitService {
  private repoPath: string;

  constructor(repoPath: string = './fabric-state') {
    this.repoPath = repoPath;
  }

  async read(path: string): Promise<string> {
    try {
      // In real implementation, use fs/git operations
      // For demo, return mock data based on path
      return this.getMockData(path);
    } catch (error) {
      throw new Error(`Failed to read ${path}: ${error}`);
    }
  }

  async write(path: string, data: string, message?: string): Promise<void> {
    try {
      // Atomic write: write to *.tmp, fsync, rename
      const tempPath = `${path}.tmp`;
      
      // Write to temp file
      await this.writeFile(tempPath, data);
      
      // Atomic rename
      await this.rename(tempPath, path);
      
      // Commit with conventional message
      const commitMessage = message || `feat(${this.getDirFromPath(path)}): update ${path}`;
      await this.commit(commitMessage);
      
    } catch (error) {
      throw new Error(`Failed to write ${path}: ${error}`);
    }
  }

  async exists(path: string): Promise<boolean> {
    try {
      await this.read(path);
      return true;
    } catch {
      return false;
    }
  }

  async list(dir: string): Promise<string[]> {
    // Mock implementation - return expected files based on directory
    const mockFiles: Record<string, string[]> = {
      'site': ['site.json'],
      'devices': ['device1.json', 'device2.json'],
      'licenses': ['LIC-123.json.age', 'LIC-456.json.age'],
      'seats': ['LIC-123', 'LIC-456'],
      'revocations': ['CRL.json'],
      'audit': ['2025-08-14.ndjson']
    };
    
    return mockFiles[dir] || [];
  }

  async pull(): Promise<void> {
    // Pull latest changes from remote
    console.log('Git pull - syncing latest changes');
    // In real implementation: git pull with conflict resolution
  }

  async push(message?: string): Promise<void> {
    // Push changes to remote
    console.log('Git push - publishing changes');
    // In real implementation: git push
  }

  private async writeFile(path: string, data: string): Promise<void> {
    // Mock file write - in real implementation use fs.writeFile
    console.log(`Writing file: ${path}`);
  }

  private async rename(oldPath: string, newPath: string): Promise<void> {
    // Mock rename - in real implementation use fs.rename
    console.log(`Renaming: ${oldPath} -> ${newPath}`);
  }

  private async commit(message: string): Promise<void> {
    // Mock commit - in real implementation use git commit
    console.log(`Git commit: ${message}`);
  }

  private getDirFromPath(path: string): string {
    return path.split('/')[0] || 'root';
  }

  private getMockData(path: string): string {
    // Return mock data based on file path
    if (path === 'site/site.json') {
      const siteConfig: SiteConfig = {
        siteId: 'SITE-001',
        wallet: 'fabric-wallet-123',
        pubkey: 'ed25519:abc123...',
        version: '1.0.0',
        ssidEnc: 'encrypted-wifi-credentials'
      };
      return JSON.stringify(siteConfig, null, 2);
    }
    
    if (path.startsWith('devices/')) {
      const device: Device = {
        fp: 'sha256:device-fingerprint',
        name: 'edge-device-01',
        role: 'edge',
        online: true,
        lastHeartbeat: new Date().toISOString(),
        enrolledAt: new Date().toISOString(),
        pubkey: 'ed25519:device-key',
        signature: 'ed25519-signature'
      };
      return JSON.stringify(device, null, 2);
    }
    
    if (path === 'revocations/CRL.json') {
      const crl: CRL = {
        revoked: ['LIC-789'],
        updated_at: new Date().toISOString(),
        signature: 'ed25519-crl-signature'
      };
      return JSON.stringify(crl, null, 2);
    }
    
    if (path.startsWith('audit/')) {
      // Return sample NDJSON provenance log
      return JSON.stringify({
        type: 'SetupDelta',
        ts: new Date().toISOString(),
        siteId: 'SITE-001',
        payload: { siteVersion: '1.0.0', wallet: 'fabric-wallet-123' },
        sig: 'ed25519-signature',
        pubkey: 'ed25519-pubkey'
      });
    }
    
    throw new Error(`File not found: ${path}`);
  }
}