# SyntheticOrchestrator (Fabric SuperNet Agent)

**Drop-in location:** `agents/SyntheticOrchestrator/`

This agent plans, spawns, supervises, and finalizes self-reconfiguring build chains without changing any SuperNet agent schema.
It uses *only* existing execution surfaces: shell/CLI calls, environment variables, and artifact files.

## Capabilities
- Plans → spawns → supervises multi-step build chains (codegen → compile → test → deploy).
- Real-time adaptation on failure (re-plan & retry with backoff).
- Emits artifacts and a live `artifacts/status.json` for dashboard consumption.
- Optional lightweight health server (`SYNTH_STATUS_PORT`, default 7777) for dashboards to poll.

## Run (manual smoke test)
```bash
cd agents/SyntheticOrchestrator
node orchestrator.mjs --plan workflows/si-default.workflow.json --report artifacts/status.json --serve 7777
```

## Files
- `manifest.yaml` — agent metadata, energy budgets, and execution class.
- `SyntheticOrchestrator.fab` — workflow hook that shells into `orchestrator.mjs` (compatible with Fabric CLI runners).
- `workflows/si-default.workflow.json` — default chain (edit safely).
- `orchestrator.mjs` — production-grade orchestrator (no external deps).
- `scripts/healthcheck.mjs` — returns a quick status snapshot (used by the optional server).
- `artifacts/` — current state, logs, and final outputs.
