import * as React from 'react';
import type { ForgeRoute } from './types';
import { ForgeProvider } from './state/ForgeContext';
import { ForgeShell } from './components/ForgeShell';

// Lazy pages
const CommunityPage = React.lazy(() => import('./pages/Community'));
const CoursesPage = React.lazy(() => import('./pages/Courses'));
const EventsPage = React.lazy(() => import('./pages/Events'));
const XpPage = React.lazy(() => import('./pages/XP'));
const AgentsPage = React.lazy(() => import('./pages/Agents'));
const ChatPage = React.lazy(() => import('./pages/Chat'));

function withForge(el: React.ReactNode) {
  return <ForgeProvider>{el}</ForgeProvider>;
}

export const Routes: ForgeRoute[] = [
  {
    path: '/forge',
    element: withForge(<React.Suspense fallback={null}><ForgeShell /></React.Suspense>),
    children: [
      { path: '/forge/community', element: <React.Suspense fallback={null}><CommunityPage /></React.Suspense> },
      { path: '/forge/courses', element: <React.Suspense fallback={null}><CoursesPage /></React.Suspense> },
      { path: '/forge/events', element: <React.Suspense fallback={null}><EventsPage /></React.Suspense> },
      { path: '/forge/xp', element: <React.Suspense fallback={null}><XpPage /></React.Suspense> },
      { path: '/forge/agents', element: <React.Suspense fallback={null}><AgentsPage /></React.Suspense> },
      { path: '/forge/chat', element: <React.Suspense fallback={null}><ChatPage /></React.Suspense> },
    ]
  }
];
