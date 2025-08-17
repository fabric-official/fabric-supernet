// Fabric Dashboard Host - Plugin API Types (HARDENED, LICENSE-READY)
// Exact Plugin Host API surface plugins can use

// -------------------- Permissions --------------------
export type Permission =
  | "runtime:read" | "runtime:ops"
  | "git:read" | "git:write"
  | "license:read" | "license:ops"        // <-- added license:ops for import/activate/revoke
  | "provenance:write"
  | "economy:read" | "economy:ops"
  | "dev:publish";

// -------------------- Plugin Manifest --------------------
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  entry: string;
  routes: string[];
  permissions: Permission[];
}

// A route renders via a factory so the host can inject a bound PluginHost.
export type RouteFactory = () => JSX.Element;

// -------------------- Host Surface --------------------
export interface FabricPluginHost {
  version: string;

  // Normalized runtime.invoke: op string + args (host may also accept {command,payload})
  runtime: {
    invoke<T = any>(op: string, args?: Record<string, any>): Promise<T>;
    // Required ops used by core plugins:
    // - "device.list" -> Device[]
    // - "license.activate" -> { ok: true }
    // - "license.deactivate" -> { ok: true } (optional but recommended)
  };

  git: {
    read(path: string): Promise<string>;
    write(path: string, data: string, message?: string): Promise<void>;
    exists(path: string): Promise<boolean>;
    list(dir: string): Promise<string[]>;
    pull(): Promise<void>;
    push(message?: string): Promise<void>;
  };

  // -------------------- Licenses API (hardened) --------------------
  licenses: {
    /**
     * List all locally installed licenses (verified + CRL-evaluated).
     * Host returns normalized records (no randomness from UI).
     */
    list(): Promise<LicenseRecord[]>;

    /**
     * Import a license file (JWS EdDSA in prod; HS256 only if FAB_DEV_LICENSES=1).
     * Bytes are verified, CRL-checked, and atomically stored by the host.
     */
    import(bytes: Uint8Array): Promise<{ ok: true; lic: LicenseRecord }>;

    /**
     * Re-verify an installed license by ID (signature, expiry, CRL).
     */
    verify(licId: string): Promise<{ ok: true; status: "active" | "revoked" | "expired"; detail?: string }>;

    /**
     * Revoke (local) or mark a license as revoked if supported by host policy.
     * (Optional; host may throw ERR_UNSUPPORTED if disabled.)
     */
    revoke(licId: string): Promise<{ ok: true }>;
  };

  provenance: {
    emit(delta: Record<string, any>): Promise<void>;
  };

  security: {
    /**
     * Verify an external signature with a host-trusted public key (kid).
     * (Primarily for internal checks; licenses use host-side trust stores.)
     */
    verifySignature(payload: Uint8Array, signature: Uint8Array, publicKeyId: string): Promise<boolean>;

    /**
     * Current CRL snapshot. Supports both compact and rich entries.
     */
    getCRL(): Promise<CRL>;
  };

  // Register route factories (keeps types aligned with Router usage)
  registerRoutes(defs: Array<{ path: string; title: string; element: RouteFactory }>): void;

  permissions(): Promise<Permission[]>;
}

// -------------------- Plugin/Route --------------------
export interface PluginRoute {
  path: string;
  title: string;
  element: RouteFactory; // callable factory, not ComponentType
}

export interface LoadedPlugin {
  manifest: PluginManifest;
  routes: PluginRoute[];
  checksum: string;
}

// -------------------- Provenance Delta Types --------------------
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

export interface LicenseImportedDelta extends BaseDelta {
  type: "LicenseImportedDelta";
  payload: {
    lic_id: string;
    pkg?: string;
    seats?: number;
    fingerprint?: string;
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

export interface LicenseUnboundDelta extends BaseDelta {
  type: "LicenseUnboundDelta";
  payload: {
    lic_id: string;
    deviceFp: string;
    pkg: string;
  };
}

export interface LicenseRevokedDelta extends BaseDelta {
  type: "LicenseRevokedDelta";
  payload: {
    lic_id: string;
    reason?: string;
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
  | LicenseImportedDelta
  | LicenseBoundDelta
  | LicenseUnboundDelta
  | LicenseRevokedDelta
  | AgentStartDelta
  | AgentStopDelta
  | PolicyViolationDelta
  | CRLUpdateDelta;

// -------------------- Device / License / CRL / Site --------------------
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

/**
 * On-disk license file (payload-level; for registry/packing contexts).
 * Plugins should prefer LicenseRecord from host.list() for UI truth.
 */
export interface License {
  lic_id: string;
  pkg: string;
  agents: string[];
  seats: number;
  org_wallet: string;
  exp: string;            // ISO8601 in this legacy shape
  watermark_id: string;
  nonce: string;
  sig: string;            // JWS compact or detached
}

/**
 * Normalized host-evaluated license record (UI should use this).
 * - derived flags: expired (from expires_at), revoked (CRL)
 * - devices: bound seat count
 */
export interface LicenseRecord {
  lic_id: string;
  pkg: string;
  seats: number;
  devices: number;
  expires_at?: string;     // ISO8601
  expired?: boolean;
  revoked?: boolean;
  issuer?: string;
  issuer_kid?: string;
  fingerprint?: string;    // sha256(payload) base64url
}

/** Rich CRL entry */
export interface CRLEntry {
  lic_id: string;
  reason?: string;
  revoked_at?: string;     // ISO8601
}

/** CRL shape (backward compatible) */
export interface CRL {
  // Either simple string IDs or rich entries; host may return both.
  revoked: Array<string | CRLEntry>;
  updated_at: string;
  signature?: string;
}

// Site configuration
export interface SiteConfig {
  siteId: string;
  wallet: string;
  ssidEnc?: string;
  pubkey: string;
  version: string;
  [key: string]: any;
}

