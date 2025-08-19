import * as React from 'react';
import { deviceBridge } from './manifest';

declare global {
  interface Window { FabricPlugins?: { register: (p:any)=>void } }
}

if (typeof window !== 'undefined' && window.FabricPlugins && typeof window.FabricPlugins.register === 'function') {
  window.FabricPlugins.register(deviceBridge);
}

export default deviceBridge;
