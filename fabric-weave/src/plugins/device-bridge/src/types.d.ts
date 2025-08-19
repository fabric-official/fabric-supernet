import * as React from 'react';

export type BridgeRole = 'admin' | 'operator' | 'viewer';

export type PluginNavItem = {
  path: string;
  label: string;
  icon?: React.FC<any>;
  requires?: BridgeRole[];
};

export type PluginRoute = {
  path: string;
  element: React.ReactNode;
  label?: string;
  icon?: React.FC<any>;
  children?: PluginRoute[];
  requires?: BridgeRole[];
};

export type DashboardPlugin = {
  id: string;
  name: string;
  version: string;
  routes: PluginRoute[];
  navItems: PluginNavItem[];
  widgets?: React.ReactNode[];
  onRegister?(ctx: {
    registerNav: (i: PluginNavItem)=>void;
    registerRoute: (r: PluginRoute)=>void;
    telemetry?: (e:any)=>void;
  }): void;
};
