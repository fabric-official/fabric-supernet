// Fabric Dashboard Host - Plugin API Types
// This defines the exact Plugin Host API surface that plugins can use

export type Permission =
  | "runtime:read" | "runtime:ops"
  | "git:read" | "git:write"
  | "license:read"
  | "provenance:write"
  | "economy:read" | "economy:ops"
  | "dev:publish";

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  entry: string;
  routes: string[];
  permissions: Permission[];
}

export interface FabricPluginHost {
  version: string;

  runtime: {
    invoke<T = any>(cmd: string, args?: Record<string, any>): Promise<T>;
  };

  git: {
    read(path: string): Promise<string>;
    write(path: string, data: string, message?: string): Promise<void>;
    exists(path: string): Promise<boolean>;
    list(dir: string): Promise<string[]>;
    pull(): Promise<void>;
    push(message?: string): Promise<void>;
  };

  licenses: {
    list(): Promise<Array<{ lic_id: string; pkg: string; seats: number; devices: number }>>;
  };

  provenance: {
    emit(delta: Record<string, any>): Promise<void>;
  };

  security: {
    verifySignature(payload: Uint8Array, signature: Uint8Array, publicKeyId: string): Promise<boolean>;
    getCRL(): Promise<{ revoked: string[]; updated_at: string }>;
  };

  registerRoutes(defs: Array<{ path: string; title: string; element: any }>): void;

  permissions(): Promise<Permission[]>;
}

export interface PluginRoute {
  path: string;
  title: string;
  element: React.ComponentType;
}

export interface LoadedPlugin {
  manifest: PluginManifest;
  routes: PluginRoute[];
  checksum: string;
}

// Provenance Delta Types
export interface BaseDelta {
  type: string;
  ts: string;
  siteId: string;
  sig: string;
  pubkey: string;
}

export interface SetupDelta extends BaseDelta {
  type: "SetupDelta";
  payload: {
    siteVersion: string;
    wallet: string;
  };
}

export interface JoinDelta extends BaseDelta {
  type: "JoinDelta";
  deviceFp: string;
  payload: {
    name: string;
    role: string;
  };
}

export interface LicenseBoundDelta extends BaseDelta {
  type: "LicenseBoundDelta";
  payload: {
    lic_id: string;
    deviceFp: string;
    pkg: string;
  };
}

export interface AgentStartDelta extends BaseDelta {
  type: "AgentStartDelta";
  payload: {
    agentId: string;
    deviceFp: string;
  };
}

export interface AgentStopDelta extends BaseDelta {
  type: "AgentStopDelta";
  payload: {
    agentId: string;
    deviceFp: string;
  };
}

export interface PolicyViolationDelta extends BaseDelta {
  type: "PolicyViolationDelta";
  deviceFp: string;
  payload: {
    diagnostics: Array<{
      severity: string;
      message: string;
      source?: string;
    }>;
  };
}

export interface CRLUpdateDelta extends BaseDelta {
  type: "CRLUpdateDelta";
  payload: {
    count: number;
  };
}

export type ProvenanceDelta = 
  | SetupDelta
  | JoinDelta
  | LicenseBoundDelta
  | AgentStartDelta
  | AgentStopDelta
  | PolicyViolationDelta
  | CRLUpdateDelta;

// Device and Network Types
export interface Device {
  fp: string;
  name: string;
  role: string;
  online: boolean;
  lastHeartbeat?: string;
  enrolledAt?: string;
  pubkey?: string;
  signature?: string;
}

export interface License {
  lic_id: string;
  pkg: string;
  agents: string[];
  seats: number;
  org_wallet: string;
  exp: string;
  watermark_id: string;
  nonce: string;
  sig: string;
}

export interface CRL {
  revoked: string[];
  updated_at: string;
  signature: string;
}

export interface SiteConfig {
  siteId: string;
  wallet: string;
  ssidEnc?: string;
  pubkey: string;
  version: string;
  [key: string]: any;
}