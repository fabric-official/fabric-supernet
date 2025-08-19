import * as React from 'react';
import type { PluginRoute } from './types';
import { BridgeProvider } from './state/BridgeContext';
import { BridgeShell } from './components/BridgeShell';

const DevicesPage = React.lazy(() => import('./pages/Devices'));
const PairPage = React.lazy(() => import('./pages/Pair'));
const TelemetryPage = React.lazy(() => import('./pages/Telemetry'));
const AgentsPage = React.lazy(() => import('./pages/Agents'));
const PoliciesPage = React.lazy(() => import('./pages/Policies'));

function withBridge(el: React.ReactNode) {
  return <BridgeProvider>{el}</BridgeProvider>;
}

export const Routes: PluginRoute[] = [
  {
    path: '/bridge',
    element: withBridge(<React.Suspense fallback={null}><BridgeShell /></React.Suspense>),
    children: [
      { path: '/bridge/devices', element: <React.Suspense fallback={null}><DevicesPage /></React.Suspense> },
      { path: '/bridge/pair', element: <React.Suspense fallback={null}><PairPage /></React.Suspense> },
      { path: '/bridge/telemetry', element: <React.Suspense fallback={null}><TelemetryPage /></React.Suspense> },
      { path: '/bridge/agents', element: <React.Suspense fallback={null}><AgentsPage /></React.Suspense> },
      { path: '/bridge/policies', element: <React.Suspense fallback={null}><PoliciesPage /></React.Suspense> },
    ]
  }
];
