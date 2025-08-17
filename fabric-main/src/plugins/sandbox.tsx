
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { resolveBundle, fetchManifest, verifyBundle } from './registry';
import type { TRegistryPlugin, TPluginManifest } from './schema';
import { deriveCaps } from './capabilities';
import { ShellSDK } from '@/sdk';

type Props = {
  plugin: TRegistryPlugin;
  route?: string;
  context?: Record<string, any>;
};

const IFRAME_SANDBOX = 'allow-scripts allow-forms';
const STYLE: React.CSSProperties = { width: '100%', height: '100%', border: 0, borderRadius: 12 };

export function PluginHost({ plugin, route = '/', context = {} }: Props) {
  const [manifest, setManifest] = useState<TPluginManifest | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const target = useMemo(() => resolveBundle(plugin), [plugin]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (plugin.manifest) {
          const m = await fetchManifest(plugin.manifest);
          if (!alive) return;
          setManifest(m);
        }
        const ok = await verifyBundle(target.url, target.sig, target.pubkeyEd25519);
        if (!ok) throw new Error('Plugin bundle verification failed');

        const html = `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob: https:; style-src 'unsafe-inline'; script-src 'unsafe-inline' https:; connect-src https: data:; font-src https: data:;">
<style>html,body,#app{margin:0;padding:0;height:100%;background:#0b1220;color:#cbd5e1;font:14px system-ui}</style>
</head><body>
<div id="app"></div>
<script type="module">
  const boot = () => {
    import("${target.url}").then(mod => {
      const init = (mod.default && typeof mod.default === 'function') ? mod.default : (mod.init || null);
      if (!init) { parent.postMessage({ t:'plugin:error', r:'No init() export' }, '*'); return; }
      init({ mountEl: document.getElementById('app'), route: ${JSON.stringify(route)} });
    }).catch(e => parent.postMessage({ t:'plugin:error', r: String(e) }, '*'));
  };
  window.addEventListener('message', (ev) => {
    const m = ev.data;
    if (m && m.t === 'host:mount') {
      const api = m.api;
      // Expose api globally for plugin convenience (optional)
      window.__SUPERNET__ = api;
      boot();
    }
  });
  parent.postMessage({ t:'plugin:ready' }, '*');
</script>
</body></html>`;
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const iframe = iframeRef.current;
        if (iframe) iframe.src = url;
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { alive = false; };
  }, [plugin, target, route]);

  useEffect(() => {
    function onMsg(ev: MessageEvent) {
      const data = ev.data;
      if (!data || typeof data !== 'object') return;
      if (data.t === 'plugin:ready') {
        const caps = deriveCaps(manifest?.permissions || plugin.permissions || []);
        const sdk = ShellSDK(caps);
        iframeRef.current?.contentWindow?.postMessage({ t:'host:mount', api: {
          pipelines: {
            build: sdk.pipelines_build,
            sign: sdk.pipelines_sign,
            publish: sdk.pipelines_publish,
            run: sdk.pipelines_run
          },
          context
        } }, '*');
      } else if (data.t === 'plugin:error') {
        console.error('Plugin error:', data.r);
      }
    }
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [manifest, plugin, context]);

  return <iframe ref={iframeRef} sandbox={IFRAME_SANDBOX} style={STYLE} title={plugin.name} />;
}

export function PluginHostRoute() {
  return <div className="p-4 text-slate-300">Implement PluginHostRoute using your router context.</div>;
}
