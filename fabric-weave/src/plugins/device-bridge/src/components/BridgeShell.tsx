import * as React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Cpu, QrCode, Activity, Boxes, Shield } from 'lucide-react';

export function BridgeShell() {
  const tabs = [
    { to: '/bridge/devices', label: 'Devices', icon: Cpu },
    { to: '/bridge/pair', label: 'Pair', icon: QrCode },
    { to: '/bridge/telemetry', label: 'Telemetry', icon: Activity },
    { to: '/bridge/agents', label: 'Agents', icon: Boxes },
    { to: '/bridge/policies', label: 'Policies', icon: Shield },
  ];
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 overflow-x-auto">
        {tabs.map(t => (
          <NavLink key={t.to} to={t.to} className={({isActive}) =>
            `px-3 py-2 rounded-xl text-sm flex items-center gap-2 border ${isActive ? 'bg-muted font-semibold' : 'hover:bg-muted/50'}`}>
            <t.icon className="w-4 h-4" />
            <span>{t.label}</span>
          </NavLink>
        ))}
      </div>
      <div className="border rounded-2xl">
        <Outlet />
      </div>
    </div>
  );
}
