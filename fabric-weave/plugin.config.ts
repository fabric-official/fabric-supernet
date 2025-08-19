// plugin.config.ts
import type { DashboardPlugin } from "@/types/plugin";

import supernetCorePlugin from "./src/plugins/supernet-core/src/index";
import deviceBridgePlugin from "./src/plugins/device-bridge/src/index";
import fabricForgePlugin from "./src/plugins/fabric-forge/src/index";

import { DevicesPlugin } from "./src/plugins/devices/DevicesPlugin";
import { WifiPlugin }    from "./src/plugins/wifi/WifiPlugin";
import { TreasuryPlugin } from "./src/plugins/treasury/TreasuryPlugin";
import { AppStorePlugin } from "./src/plugins/appstore/AppStorePlugin";

// --- AUTO-PLUGINS START (managed by installer; do not edit inside) ---
export const AUTO_PLUGINS = [
  supernetCorePlugin,
  deviceBridgePlugin,
  fabricForgePlugin,
] as const;
// --- AUTO-PLUGINS END ---

export const plugins: DashboardPlugin[] = [
  ...AUTO_PLUGINS,
  AppStorePlugin,
  DevicesPlugin,
  WifiPlugin,
  TreasuryPlugin,
];

export default plugins;
