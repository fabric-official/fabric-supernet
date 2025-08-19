# Fabric Forge (Plugin)

**Version:** 1.0.0  
**Purpose:** Skool-style **learning + community + events + XP + agents + chat** for the Fabric Supernet Dashboard.

## Features
- Community feed with composer, server-pushed updates (SSE)
- Courses (structured tracks; intro → advanced)
- Events calendar list
- XP panel with level progression
- Agent showcases (forks, royalties, XP awards)
- **Live chat** with rooms (#general, #help, #showcase) via WebSocket, SSE fallback for feed

## Hardening Notes
- Strong TS types w/ Zod validation at API boundaries
- Text escaped on render to avoid XSS (`utils/sanitize.ts`)
- Network timeouts & abort controllers in API client
- Jittered reconnects for WebSocket
- No global mutable singletons; state is encapsulated in `ForgeProvider`

## Expected Server Endpoints
- `GET  /api/forge/feed` → `FeedPost[]`
- `POST /api/forge/feed` → `{ ok, post }`
- `GET  /api/forge/feed/stream` (EventSource/SSE) → `FeedPost` items
- `WS   /api/forge/chat` → `ChatMessage` JSON frames
- `GET  /api/forge/courses` → `Course[]`
- `GET  /api/forge/events` → `Event[]`
- `GET  /api/forge/agents` → `Agent[]`
- `GET  /api/forge/xp` → `{ userId, level, points, nextLevelAt }`

You can mount these under another base by setting globals before app init:
```html
<script>
  window.__FABRIC__ = { apiBase: '/api', wsBase: 'wss://your-host' };
</script>
```

## Integrating with the Dashboard
1. Drop this folder into `fabric-supernet/plugins/fabric-forge/` **or** add it as a workspace package.
2. Ensure the dashboard plugin loader calls `window.FabricPlugins.register(plugin)` OR import and register directly:
```ts
import fabricForge from '@fabric-official/fabric-forge';
registerPlugin(fabricForge);
```
3. Build:
```bash
pnpm i
pnpm --filter @fabric-official/fabric-forge build
```

## Routes
- `/forge` (shell)
  - `/forge/community`
  - `/forge/courses`
  - `/forge/events`
  - `/forge/xp`
  - `/forge/agents`
  - `/forge/chat`

## License
Apache-2.0 © 2025 Atomic Limited
