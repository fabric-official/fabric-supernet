import React from "react";

export type Capability = string;

export type PluginManifest = {
  id: string;
  title: string;
  entry?: () => Promise<{ default: React.ComponentType<any> }>;
  capabilities: Capability[];
};

const registry: PluginManifest[] = [];

/** Register (de-duped by id) */
export function registerPlugin(p: PluginManifest) {
  const i = registry.findIndex(x => x.id === p.id);
  if (i >= 0) registry.splice(i, 1);
  registry.push(p);
}

/** Safe registry view; prefers host-provided list via preload bridge */
export async function listPlugins(): Promise<Array<Pick<PluginManifest, "id"|"title"|"capabilities">>> {
  try {
    const hostList = await (window as any).fabric?.invoke?.("plugin:list");
    if (Array.isArray(hostList) && hostList.length) {
      return hostList.map((p: any) => ({
        id: p.id,
        title: p.title,
        capabilities: Array.isArray(p.capabilities) ? p.capabilities : []
      }));
    }
  } catch { /* fall back to local */ }
  return registry.map(p => ({ id: p.id, title: p.title, capabilities: p.capabilities }));
}

/** Loads a plugin’s component iff caller has required capabilities */
export async function loadPlugin(id: string, haveCaps: Capability[]): Promise<React.ComponentType<any> | null> {
  const meta = registry.find(p => p.id === id);
  if (!meta || !meta.entry) return null;

  const need = new Set(meta.capabilities || []);
  const ok = [...need].every(n => haveCaps.includes(n));
  if (!ok) throw new Error(`Missing capability to load plugin "${id}"`);

  const mod = await meta.entry();
  return (mod && (mod as any).default) || null;
}

/** Bootstrap a core plugin (placeholder Backboard; replace with your real one) */
(function bootstrap() {
  try {
    registerPlugin({
      id: "backboard",
      title: "SuperNet Backboard",
      capabilities: ["plugins:read"],
      entry: async () => await import("../plugins/Backboard"),
    });
  } catch {}
})();

/** Optional default export for consumers using default import */
export default { registerPlugin, listPlugins, loadPlugin };
