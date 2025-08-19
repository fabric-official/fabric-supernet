// src/types/plugin.ts
import type { FC, ReactNode } from "react";

/** Context passed to plugins at register() time */
export interface PluginContext {
  api: import("@/core/api/client").ApiClient;
  events: import("@/core/bus").EventBus;
  store: import("@/core/store").AppStore;
  rbac: import("@/core/rbac").RBAC;
  theme: import("@/core/theme").ThemeAPI;
}

/** Optional nav metadata for sidebars/menus */
export interface PluginNavMeta {
  label: string;
  order?: number;
  hidden?: boolean;
  icon?: any;               // Lucide component or element
  permissions?: string[];
}

/** Route definition â€” single, normalized shape (no unions) */
export interface PluginRoute {
  path: string;                           // e.g. "/forge", "/forge/chat"
  element: ReactNode;                     // ready-to-render element (can be lazy-wrapped)
  meta?: { title?: string; nav?: PluginNavMeta };
}

/** Base shared fields */
export interface DashboardPluginBase {
  /** Unique, kebab-case id. */
  id: string;
  /** Display name; used as a fallback when routes[].meta.nav.label missing */
  title?: string;
  /** Optional Lucide icon for top-level menu grouping */
  icon?: any;

  /**
   * Overview widgets rendered on `/overview`.
   * Accept zero-prop components (FC) or legacy ReactNode widgets.
   * The Overview page already normalizes these to FC at render time.
   */
  widgets?: Array<FC | ReactNode>;

  /** RBAC permission strings required to view plugin (fallback) */
  permissions?: string[];

  /** Optional lifecycle hook for background tasks/registrations. */
  register?(ctx: PluginContext): void | (() => void);
}

/** Legacy single-page plugin shape (kept for compatibility) */
export interface DashboardSinglePage extends DashboardPluginBase {
  route: string;                    // e.g. "/devices"
  page: FC | ReactNode;             // Overview/Router will normalize at render time
}

/** Modern multi-route plugin shape (preferred) */
export interface DashboardMultiRoute extends DashboardPluginBase {
  routes: PluginRoute[];            // one or more routes with elements + nav meta
}

/** A plugin can be either single-page or multi-route */
export type DashboardPlugin = DashboardSinglePage | DashboardMultiRoute;


