Fabric Supernet — End-to-End Harness (Docker Compose + Stop-on-Fail)
===================================================================

What this is
------------
A complete E2E test harness that:
- Spins up your **dashboard + backend** with `docker compose` (profile=real or mock).
- Waits for health, then runs **full system tests** across all core panels.
- **Stops on any error**, lets you fix, then **retry/skip/stop** interactively.
- Produces Playwright traces, screenshots, and Docker logs on demand.

Included
--------
- `docker-compose.yml` ........ Compose template (edit the contexts/Dockerfiles to match your repo)
- `.env.example` .............. All parameters (copy to `.env` and edit)
- `scripts/e2e.mjs` ........... Orchestrator (compose up → wait → run tests with stop-on-fail)
- `playwright.config.ts` ...... Browser test config (trace/video on failures)
- `tests/e2e/*.spec.ts` ....... Device, Policy, Registry, Treasury+DAO, Telemetry, App Store, Dead-click sweep

Quick start
-----------
1) Put this folder at your repo root.
2) Copy `.env.example` to `.env` and set:
   - `DASHBOARD_CONTEXT` → path to your dashboard (e.g., `../fabric-main`)
   - `API_CONTEXT` → path to your backend/api (e.g., `../api`)
   - Health endpoints (`DASHBOARD_HEALTH`, `API_HEALTH`)
3) Build and run E2E:
   ```bash
   npm i
   npm run prepare
   npm run e2e
   ```
   The runner will:
   - `docker compose up -d --profile ${PROFILE}`
   - Wait for health on both services
   - Run tests sequentially
   - On failure, prompt: **Retry / Skip / Stop / Logs**

Notes & assumptions
-------------------
- Expected API endpoints (adjust in your backend or modify specs):
  - `POST /api/devices/enroll`
  - `POST /api/policies`
  - `POST /api/registry/agents`
  - `POST /api/treasury/deposit`
  - `POST /api/dao/proposals`
  - `POST /api/telemetry/ingest`
  - `POST /api/app-store/install`
  - `GET  /api/health` (for readiness)
- UI routes assumed (tweak with `ROUTES` in `.env` or edit specs):
  - `/`, `/pair`, `/wifi`, `/devices`, `/policies`, `/registry`, `/treasury`, `/dao`, `/telemetry`, `/app-store`
- If an endpoint isn’t implemented yet, the test **fails** (by design) → fix and **Retry**.
- Compose file is a **template**: set build contexts and Dockerfiles to match your repo layout.
- If you only want dashboard UI with mocks, set `PROFILE=mock` in `.env`.

Troubleshooting
---------------
- **Bring-up fails**: `docker compose logs api dashboard` (or choose **Logs** at prompt).
- **Tests hang**: Check `BASE_URL` and `API_BASE` in `.env` and service ports.
- **Different endpoints**: Edit the corresponding `.spec.ts` to your actual API.
- **Artifacts**: Playwright stores traces/screenshots/videos on failures.
