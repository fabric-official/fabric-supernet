// Fabric Dashboard Host - Core Plugin Host Implementation
import { FabricPluginHost, Permission, PluginRoute, ProvenanceDelta } from '@/types/plugin';
import { GitService } from './GitService';
import { RuntimeService } from './RuntimeService';
import { SecurityService } from './SecurityService';
import { LicenseService } from './LicenseService';
import { ProvenanceService } from './ProvenanceService';

export class PluginHost implements FabricPluginHost {
  version = "1.0.0";
  
  private pluginPermissions: Permission[] = [];
  private registeredRoutes: PluginRoute[] = [];
  
  constructor(
    private gitService: GitService,
    private runtimeService: RuntimeService,
    private securityService: SecurityService,
    private licenseService: LicenseService,
    private provenanceService: ProvenanceService,
    permissions: Permission[]
  ) {
    this.pluginPermissions = permissions;
  }

  // Runtime bridge with permission checking
  runtime = {
    invoke: async <T = any>(cmd: string, args?: Record<string, any>): Promise<T> => {
      // Check permissions before any runtime operation
      if (cmd.startsWith('agent.') && !this.hasPermission('runtime:ops')) {
        throw new Error(`Permission denied: runtime:ops required for ${cmd}`);
      }
      
      if (!this.hasPermission('runtime:read')) {
        throw new Error(`Permission denied: runtime:read required for ${cmd}`);
      }

      return this.runtimeService.invoke<T>(cmd, args);
    }
  };

  // Git bridge with permission checking
  git = {
    read: async (path: string): Promise<string> => {
      if (!this.hasPermission('git:read')) {
        throw new Error('Permission denied: git:read required');
      }
      return this.gitService.read(path);
    },

    write: async (path: string, data: string, message?: string): Promise<void> => {
      if (!this.hasPermission('git:write')) {
        throw new Error('Permission denied: git:write required');
      }
      return this.gitService.write(path, data, message);
    },

    exists: async (path: string): Promise<boolean> => {
      if (!this.hasPermission('git:read')) {
        throw new Error('Permission denied: git:read required');
      }
      return this.gitService.exists(path);
    },

    list: async (dir: string): Promise<string[]> => {
      if (!this.hasPermission('git:read')) {
        throw new Error('Permission denied: git:read required');
      }
      return this.gitService.list(dir);
    },

    pull: async (): Promise<void> => {
      if (!this.hasPermission('git:read')) {
        throw new Error('Permission denied: git:read required');
      }
      return this.gitService.pull();
    },

    push: async (message?: string): Promise<void> => {
      if (!this.hasPermission('git:write')) {
        throw new Error('Permission denied: git:write required');
      }
      return this.gitService.push(message);
    }
  };

  // License bridge
  licenses = {
    list: async () => {
      if (!this.hasPermission('license:read')) {
        throw new Error('Permission denied: license:read required');
      }
      return this.licenseService.list();
    }
  };

  // Provenance bridge
  provenance = {
    emit: async (delta: Record<string, any>): Promise<void> => {
      if (!this.hasPermission('provenance:write')) {
        throw new Error('Permission denied: provenance:write required');
      }
      return this.provenanceService.emit(delta as ProvenanceDelta);
    }
  };

  // Security bridge
  security = {
    verifySignature: async (payload: Uint8Array, signature: Uint8Array, publicKeyId: string): Promise<boolean> => {
      return this.securityService.verifySignature(payload, signature, publicKeyId);
    },

    getCRL: async () => {
      return this.securityService.getCRL();
    }
  };

  // Route registration
  registerRoutes = (defs: Array<{ path: string; title: string; element: any }>): void => {
    this.registeredRoutes = defs.map(def => ({
      path: def.path,
      title: def.title,
      element: def.element
    }));
  };

  // Permission check
  permissions = async (): Promise<Permission[]> => {
    return [...this.pluginPermissions];
  };

  // Internal helpers
  private hasPermission(permission: Permission): boolean {
    return this.pluginPermissions.includes(permission);
  }

  getRoutes(): PluginRoute[] {
    return [...this.registeredRoutes];
  }
}