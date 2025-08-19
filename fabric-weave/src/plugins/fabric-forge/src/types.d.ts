import * as React from 'react';

export type ForgeRole = 'admin' | 'mentor' | 'member';

export type ForgeNavItem = {
  path: string;
  label: string;
  icon?: React.FC<any>;
  requires?: ForgeRole[];
};

export type ForgeRoute = {
  path: string;
  element: React.ReactNode;
  label?: string;
  icon?: React.FC<any>;
  children?: ForgeRoute[];
  requires?: ForgeRole[];
};

export type DashboardPlugin = {
  id: string;
  name: string;
  version: string;
  routes: ForgeRoute[];
  navItems: ForgeNavItem[];
  widgets?: React.ReactNode[];
  onRegister?(ctx: { registerNav: (i: ForgeNavItem)=>void; registerRoute: (r: ForgeRoute)=>void; telemetry?: (e:any)=>void }): void;
};
