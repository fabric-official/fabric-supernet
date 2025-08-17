
# Supernet App Store (Open-Source Plugin Registry) — Integration Pack

This pack wires an **open-source, GitHub-backed plugin registry** (no server storage) into the **Supernet** dashboard.

## What you get

- `src/plugins/schema.ts` — Zod schemas (registry + manifest).
- `src/plugins/security.ts` — Ed25519 detached-signature verification (WebCrypto).
- `src/plugins/registry.ts` — hardened fetcher for `registry/index.json` and plugin manifests; verifies signatures; caches.
- `src/plugins/capabilities.ts` — capability map + enforcement wrapper for the Shell SDK.
- `src/plugins/mounts.tsx` — mount system for Overview KPIs, Agent tabs, ForkTree node cards, Context panels.
- `src/plugins/sandbox.tsx` — sandboxed iframe PluginHost with strict CSP and postMessage bridge.
- `src/state/plugins.store.ts` — org-scoped install/enable/config/audit via Zustand.
- `src/routes/marketplace/{List,Detail,Install}.tsx` — client-only App Store UI (reads GitHub directly).
- `src/sdk/index.ts` — minimal Shell SDK adapter (capability-checked) calling your existing endpoints and local `fab` bridge.
- `src/utils/fetchers.ts` — robust fetch with timeout, ETag/caching helpers, content hashing.
- `src/types/env.d.ts` — typed env vars used by the pack.

> No server-side mirroring: artifacts and manifests are fetched **directly from GitHub** and verified in-client.

## Env

Create or extend `.env` / `.env.local`:

```
VITE_APPSTORE_REGISTRY_URL=https://raw.githubusercontent.com/fabric-official/app-store/main/registry/index.json
VITE_APPSTORE_REGISTRY_SIG_URL=https://raw.githubusercontent.com/fabric-official/app-store/main/registry/index.json.sig
# Base64 (raw 32-byte) Ed25519 public key for the registry signature
VITE_APPSTORE_PUBKEY_ED25519=BASE64_PUBLIC_KEY_BYTES

# Optional: default publisher key for bundles (if registry doesn't provide per-plugin keys)
VITE_PLUGIN_DEFAULT_PUBKEY_ED25519=BASE64_PUBLIC_KEY_BYTES
```

## Wire points

- Add to **Overview** page:
  ```tsx
  <MountPoint slot="overview:kpis" />
  ```
- Add to **Agent detail**:
  ```tsx
  <MountPoint slot="agent:tabs" agentId={agent.id} />
  ```
- Add to **Fork Tree** node card:
  ```tsx
  <MountPoint slot="forktree:cards" node={node} />
  ```
- Add **route**:
  ```tsx
  <Route path="/plugins/:pluginId/*" element={<PluginHostRoute />} />
  ```
- Add **Marketplace** routes:
  ```tsx
  <Route path="/marketplace" element={<StoreList />} />
  <Route path="/marketplace/:pluginId" element={<StoreDetail />} />
  <Route path="/marketplace/:pluginId/install" element={<StoreInstall />} />
  ```

## Security defaults

- Iframes use `sandbox="allow-scripts allow-forms"` **only**.
- No `allow-same-origin` → plugin runs in an **opaque origin** (strong isolation).
- All bundles/registries require **Ed25519 signature** verification before activation.
- Capabilities enforced at callsite; sensitive ops require **device approval** and immutable audit.

## Tests
- Add your e2e checks to verify: install → enable → mounts appear → sign/publish blocked without approvals → uninstall detaches cleanly.

---

Drop the `src/` content under your `fabric-main/src/`, adapt imports where needed.
