// Device Bridge expected endpoints (server-side):
// GET  /api/bridge/devices
// POST /api/bridge/devices/:id/approve
// POST /api/bridge/devices/:id/reject
// POST /api/bridge/devices/:id/assign-agent   { agentId }
// POST /api/bridge/devices/:id/energy         { energyBudget }
// GET  /api/bridge/agents
// GET  /api/bridge/pair?kind=android|ios|router|linux|windows|mac|iot   -> { payload }
// GET  /api/bridge/telemetry/stream    (EventSource/SSE)
// WS   /api/bridge/events              (JSON frames: { type: 'device_status', device: {...} })

console.log('Device Bridge seed helper — mock endpoints as needed for local dev.');
