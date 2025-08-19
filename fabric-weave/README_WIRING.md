# Fabric Weave Dashboard — Wired Build

## Quick Start (Local)

### 1) Start Auth API (no native deps)
```
cd services/auth
npm ci
npm run build
set PORT=8787 && node dist/server.js
# or: $env:PORT=8787; node dist/server.js  (PowerShell)
```
Health: `http://127.0.0.1:8787/api/health`

### 2) Start the Dashboard
```
npm ci
# optional: echo VITE_API_BASE=http://127.0.0.1:8787 > .env.local
npm run dev
```
Now open the URL Vite prints (8080/8081/8082).

### 3) Auth flow
- Create Account → POST `/api/auth/register` (201 or 409 if exists)
- Sign In → POST `/api/auth/login`
- The app auto loads `/api/auth/me` and stores `auth_token`/`auth_email`

## Docker (optional)
```
cd services/auth
docker build -t fabric-auth .
docker run -p 8787:8787 fabric-auth
```

## Endpoints expected by the dashboard
- `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- `/api/admin/devices`  → returns `{ items: Device[] }` or `Device[]`
- `/api/wifi/scan`      → returns `{ networks: Network[] }` or `Network[]`
- `/api/treasury/metrics` → returns `{ metrics: Metric[] }` or `Metric[]`
