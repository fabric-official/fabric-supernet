export type Permission =
  | "runtime:read" | "runtime:ops"
  | "git:read" | "git:write"
  | "license:read"
  | "provenance:write"
  | "economy:read" | "economy:ops"
  | "dev:publish";
export interface FabricPluginHost {
  version: string;
  runtime: { invoke<T=any>(cmd: string, args?: Record<string, any>): Promise<T> };
  git: {
    read(path: string): Promise<string>;
    write(path: string, data: string, message?: string): Promise<void>;
    exists(path: string): Promise<boolean>;
    list(dir: string): Promise<string[]>;
    pull(): Promise<void>;
    push(message?: string): Promise<void>;
  };
  licenses: { list(): Promise<Array<{ lic_id: string; pkg: string; seats: number; devices: number }>> };
  provenance: { emit(delta: Record<string, any>): Promise<void> };
  security: {
    verifySignature(payload: Uint8Array, signature: Uint8Array, publicKeyId: string): Promise<boolean>;
    getCRL(): Promise<{ revoked: string[]; updated_at: string }>;
  };
  registerRoutes(defs: Array<{ path: string; title: string; element: any }>): void;
  permissions(): Promise<Permission[]>;
}
declare global { interface Window { FabricPluginHost: FabricPluginHost } }