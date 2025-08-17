// src/services/PluginHost.ts
// Fabric Dashboard Host - Core Plugin Host Implementation (PROD, no mocks)

import {
  FabricPluginHost,
  Permission,
  PluginRoute,
  ProvenanceDelta,
  RouteFactory,
  LicenseRecord,
  CRL,
} from "@/types/plugin";
import { GitService } from "./GitService";
import { RuntimeService } from "./RuntimeService";
import { SecurityService } from "./SecurityService";
import { LicenseService } from "./LicenseService";
import { ProvenanceService } from "./ProvenanceService";

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
    permissions: Permission[],
  ) {
    this.pluginPermissions = permissions;
  }

  // ---------- Runtime bridge with permission checks ----------
  runtime = {
    invoke: async <T = any>(cmd: string, args?: Record<string, any>): Promise<T> => {
      // All runtime access requires read
      this.requirePermission("runtime:read", `runtime:read required for ${cmd}`);

      // Mutating runtime ops require ops permission
      if (this.isMutatingRuntimeCmd(cmd)) {
        this.requirePermission("runtime:ops", `runtime:ops required for ${cmd}`);
      }

      return this.runtimeService.invoke<T>(cmd, args);
    },
  };

  // ---------- Git bridge with permission checks ----------
  git = {
    read: async (path: string): Promise<string> => {
      this.requirePermission("git:read", "git:read required");
      return this.gitService.read(path);
    },

    write: async (path: string, data: string, message?: string): Promise<void> => {
      this.requirePermission("git:write", "git:write required");
      return this.gitService.write(path, data, message);
    },

    exists: async (path: string): Promise<boolean> => {
      this.requirePermission("git:read", "git:read required");
      return this.gitService.exists(path);
    },

    list: async (dir: string): Promise<string[]> => {
      this.requirePermission("git:read", "git:read required");
      return this.gitService.list(dir);
    },

    pull: async (): Promise<void> => {
      this.requirePermission("git:read", "git:read required");
      return this.gitService.pull();
    },

    push: async (message?: string): Promise<void> => {
      this.requirePermission("git:write", "git:write required");
      return this.gitService.push(message);
    },
  };

  // ---------- License bridge (HARDENED) ----------
  licenses = {
    list: async (): Promise<LicenseRecord[]> => {
      this.requirePermission("license:read", "license:read required");
      // If LicenseService already defines list(): Promise<LicenseRecord[]>, this is fully typed.
      return (this.licenseService as unknown as {
        list(): Promise<LicenseRecord[]>;
      }).list();
    },

    import: async (bytes: Uint8Array): Promise<{ ok: true; lic: LicenseRecord }> => {
      this.requirePermission("license:ops", "license:ops required for import");
      return (this.licenseService as unknown as {
        import(bytes: Uint8Array): Promise<{ ok: true; lic: LicenseRecord }>;
      }).import(bytes);
    },

    verify: async (
      licId: string,
    ): Promise<{ ok: true; status: "active" | "revoked" | "expired"; detail?: string }> => {
      this.requirePermission("license:read", "license:read required for verify");
      return (this.licenseService as unknown as {
        verify(licId: string): Promise<{ ok: true; status: "active" | "revoked" | "expired"; detail?: string }>;
      }).verify(licId);
    },

    revoke: async (licId: string): Promise<{ ok: true }> => {
      this.requirePermission("license:ops", "license:ops required for revoke");
      return (this.licenseService as unknown as {
        revoke(licId: string): Promise<{ ok: true }>;
      }).revoke(licId);
    },
  };

  // ---------- Provenance bridge ----------
  provenance = {
    emit: async (delta: Record<string, any>): Promise<void> => {
      this.requirePermission("provenance:write", "provenance:write required");
      return this.provenanceService.emit(delta as ProvenanceDelta);
    },
  };

  // ---------- Security bridge ----------
  security = {
    verifySignature: async (
      payload: Uint8Array,
      signature: Uint8Array,
      publicKeyId: string,
    ): Promise<boolean> => {
      return this.securityService.verifySignature(payload, signature, publicKeyId);
    },

    getCRL: async (): Promise<CRL> => {
      return this.securityService.getCRL();
    },
  };

  // ---------- Route registration (RouteFactory) ----------
  registerRoutes = (
    defs: Array<{ path: string; title: string; element: RouteFactory }>,
  ): void => {
    this.registeredRoutes = defs.map((def) => ({
      path: def.path,
      title: def.title,
      element: def.element, // factory (() => JSX.Element)
    }));
  };

  // ---------- Permission query ----------
  permissions = async (): Promise<Permission[]> => {
    return [...this.pluginPermissions];
  };

  // ---------- Public accessor for PluginManager ----------
  getRoutes(): PluginRoute[] {
    return [...this.registeredRoutes];
  }

  // ---------- Internals ----------
  private hasPermission(permission: Permission): boolean {
    return this.pluginPermissions.includes(permission);
  }

  private requirePermission(permission: Permission, msg: string): void {
    if (!this.hasPermission(permission)) {
      throw new Error(`Permission denied: ${msg}`);
    }
  }

  // Treat these runtime commands as mutating and require runtime:ops
  private isMutatingRuntimeCmd(cmd: string): boolean {
    if (cmd.startsWith("agent.")) return true; // agent.start/stop/update
    // Explicit mutations:
    switch (cmd) {
      case "wifi.join":
      case "device.enroll":
      case "license.activate":
      case "license.deactivate":
        return true;
      default:
        return false;
    }
  }
}
