import React from "react";
export type Capability = string;

export type PluginManifest = {
  id: string;
  title: string;
  entry?: () => Promise<{ default: React.ComponentType<any> }>;
  capabilities: Capability[];
};

const registry: PluginManifest[] = [];

export function registerPlugin(p: PluginManifest) {
  const i = registry.findIndex(x => x.id === p.id);
  if (i >= 0) registry.splice(i, 1);
  registry.push(p);
}

export async function listPlugins(): Promise<Array<Pick<PluginManifest,"id"|"title"|"capabilities">>> {
  try {
    const hostList = await (window as any).fabric?.invoke?.("plugin:list");
    if (Array.isArray(hostList) && hostList.length) {
      return hostList.map((p: any) => ({ id: p.id, title: p.title, capabilities: Array.isArray(p.capabilities)?p.capabilities:[] }));
    }
  } catch {}
  return registry.map(p => ({ id: p.id, title: p.title, capabilities: p.capabilities }));
}

export async function loadPlugin(id: string, haveCaps: Capability[]): Promise<React.ComponentType<any> | null> {
  const meta = registry.find(p => p.id === id);
  if (!meta || !meta.entry) return null;
  const need = new Set(meta.capabilities || []);
  const ok = [...need].every(n => haveCaps.includes(n));
  if (!ok) throw new Error(`Missing capability to load plugin "${id}"`);
  const mod = await meta.entry();
  return (mod && (mod as any).default) || null;
}

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
