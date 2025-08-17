
import { create } from 'zustand';
import type { TRegistryIndex } from '@/plugins/schema';

type State = {
  registry: TRegistryIndex | null;
  installed: string[]; // plugin ids
  enabled: string[];
  config: Record<string, any>;
};

type Actions = {
  setRegistry: (r: TRegistryIndex) => void;
  install: (id: string) => void;
  uninstall: (id: string) => void;
  enable: (id: string) => void;
  disable: (id: string) => void;
  setConfig: (id: string, cfg: any) => void;
  reset: () => void;
};

export const usePluginsStore = create<State & Actions>((set, get) => ({
  registry: null,
  installed: [],
  enabled: [],
  config: {},
  setRegistry: (r) => set({ registry: r }),
  install: (id) => set(s => ({ installed: Array.from(new Set([...s.installed, id])) })),
  uninstall: (id) => set(s => ({
    installed: s.installed.filter(x => x !== id),
    enabled: s.enabled.filter(x => x !== id),
    config: Object.fromEntries(Object.entries(s.config).filter(([k]) => k !== id))
  })),
  enable: (id) => set(s => ({ enabled: Array.from(new Set([...s.enabled, id])) })),
  disable: (id) => set(s => ({ enabled: s.enabled.filter(x => x !== id) })),
  setConfig: (id, cfg) => set(s => ({ config: { ...s.config, [id]: cfg } })),
  reset: () => set({ registry: null, installed: [], enabled: [], config: {} })
}));
