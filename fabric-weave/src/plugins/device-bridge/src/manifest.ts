import * as React from 'react';
import type { DashboardPlugin } from './types';
import { Routes } from './routes';
import { Cpu, QrCode, Activity, Boxes, Shield } from 'lucide-react';

export const deviceBridge: DashboardPlugin = {
  id: 'device-bridge',
  name: 'Device Bridge',
  version: '1.0.0',
  routes: Routes,
  navItems: [
    { path: '/bridge/devices', label: 'Devices', icon: Cpu },
    { path: '/bridge/pair', label: 'Pair', icon: QrCode },
    { path: '/bridge/telemetry', label: 'Telemetry', icon: Activity },
    { path: '/bridge/agents', label: 'Agents', icon: Boxes },
    { path: '/bridge/policies', label: 'Policies', icon: Shield },
  ],
  onRegister(ctx) {
    for (const item of this.navItems) ctx.registerNav(item);
    for (const r of this.routes) ctx.registerRoute(r);
  }
};
