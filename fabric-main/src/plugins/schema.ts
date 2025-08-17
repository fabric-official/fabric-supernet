
import { z } from 'zod';

/** Registry index (app-store/registry/index.json) */
export const RegistryPluginVersion = z.object({
  v: z.string(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/i).optional(),
  url: z.string().url(),
  sig: z.string().url().optional(),
  sbom: z.string().url().optional(),
  minShell: z.string().optional(),
  pubkeyEd25519: z.string().optional() // base64 (raw 32 bytes) if per-plugin key
});

export const RegistryPlugin = z.object({
  id: z.string().min(3),
  name: z.string(),
  publisher: z.string(),
  description: z.string().optional(),
  categories: z.array(z.string()).optional(),
  latest: z.string(),
  versions: z.array(RegistryPluginVersion).min(1),
  permissions: z.array(z.string()).optional(),
  screenshots: z.array(z.string().url()).optional(),
  trust: z.object({
    sbom: z.boolean().optional(),
    license: z.string().optional(),
    daoBadge: z.string().optional()
  }).optional(),
  manifest: z.string().url().optional()
});

export const RegistryIndex = z.object({
  version: z.literal(1),
  plugins: z.array(RegistryPlugin)
});

/** Plugin manifest (plugins/<id>/fabric-plugin.json) */
export const PluginManifest = z.object({
  id: z.string().min(3),
  name: z.string(),
  version: z.string(),
  publisher: z.string().optional(),
  entry: z.string(), // bundle/index.esm.js
  routes: z.array(z.object({ path: z.string(), title: z.string(), navGroup: z.string().optional() })).optional(),
  mountPoints: z.object({
    'overview:kpis': z.array(z.string()).optional(),
    'agent:tabs': z.array(z.string()).optional(),
    'forktree:cards': z.array(z.string()).optional(),
    'context:panel': z.array(z.string()).optional()
  }).partial().default({}),
  permissions: z.array(z.string()).default([]),
  settingsSchema: z.any().optional(),
  webhooks: z.array(z.string()).optional(),
  minimumShell: z.string().optional(),
  egressAllowlist: z.array(z.string().url()).optional()
});

export type TRegistryIndex = z.infer<typeof RegistryIndex>;
export type TRegistryPlugin = z.infer<typeof RegistryPlugin>;
export type TRegistryPluginVersion = z.infer<typeof RegistryPluginVersion>;
export type TPluginManifest = z.infer<typeof PluginManifest>;
