import * as React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { MessageSquare, GraduationCap, Calendar, Trophy, Boxes, MessageCircle } from 'lucide-react';

export function ForgeShell() {
  const tabs = [
    { to: '/forge/community', label: 'Community', icon: MessageSquare },
    { to: '/forge/courses', label: 'Courses', icon: GraduationCap },
    { to: '/forge/events', label: 'Events', icon: Calendar },
    { to: '/forge/xp', label: 'XP', icon: Trophy },
    { to: '/forge/agents', label: 'Agents', icon: Boxes },
    { to: '/forge/chat', label: 'Chat', icon: MessageCircle },
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
