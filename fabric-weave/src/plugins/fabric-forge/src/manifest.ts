import * as React from 'react';
import type { DashboardPlugin } from './types';
import { Routes } from './routes';
import { MessageSquare, GraduationCap, Calendar, Trophy, Boxes, MessageCircle } from 'lucide-react';

export const fabricForge: DashboardPlugin = {
  id: 'fabric-forge',
  name: 'Fabric Forge',
  version: '1.0.0',
  routes: Routes,
  navItems: [
    { path: '/forge/community', label: 'Community', icon: MessageSquare },
    { path: '/forge/courses', label: 'Courses', icon: GraduationCap },
    { path: '/forge/events', label: 'Events', icon: Calendar },
    { path: '/forge/xp', label: 'XP', icon: Trophy },
    { path: '/forge/agents', label: 'Agents', icon: Boxes },
    { path: '/forge/chat', label: 'Chat', icon: MessageCircle },
  ],
  onRegister(ctx) {
    for (const item of this.navItems) ctx.registerNav(item);
    for (const r of this.routes) ctx.registerRoute(r);
  }
};
