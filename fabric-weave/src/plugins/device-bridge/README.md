# Device Bridge (Plugin)

**Version:** 1.0.0  
**Purpose:** Secure device enrollment, pairing (QR), telemetry streaming, and agent assignment for the Fabric Supernet.

## Features
- Devices table: approve/reject, set energy budget, assign agents
- Pairing flow with QR generation per device kind
- Live telemetry via SSE, device status via WS
- Agents catalog view
- Policy panel for per-device energy budgets

## Security & Hardening
- Strong type validation at API boundaries (Zod)
- Request timeouts + abort controller
- WS jittered reconnect; SSE fallback
- No dangerous HTML injection; sanitized text
- Minimal permission surface: only required `/api/bridge/*` calls

## Expected Endpoints
- `GET  /api/bridge/devices` → `Device[]`
- `POST /api/bridge/devices/:id/approve` → `{ ok }`
- `POST /api/bridge/devices/:id/reject` → `{ ok }`
- `POST /api/bridge/devices/:id/assign-agent` → `{ ok }`
- `POST /api/bridge/devices/:id/energy` → `{ ok }`
- `GET  /api/bridge/agents` → `Agent[]`
- `GET  /api/bridge/pair?kind=...` → `{ payload }` (string to encode into QR)
- `GET  /api/bridge/telemetry/stream` → `TelemetryEvent` (SSE each line)
- `WS   /api/bridge/events` → `{ type:'device_status', device: Device }`

## Integrating
1. Place this folder under `fabric-supernet/plugins/device-bridge/` or add as a workspace.
2. Ensure your plugin loader calls `window.FabricPlugins.register(plugin)` or registers directly:
```ts
import deviceBridge from '@fabric-official/device-bridge';
registerPlugin(deviceBridge);
```
3. Build:
```bash
pnpm i
pnpm --filter @fabric-official/device-bridge build
```

## Routes
- `/bridge/devices`
- `/bridge/pair`
- `/bridge/telemetry`
- `/bridge/agents`
- `/bridge/policies`

## License
Apache-2.0 © 2025 Atomic Limited
