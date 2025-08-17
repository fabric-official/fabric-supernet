
# Publisher Guide

1) Create `plugins/<publisher>.<name>/`.
2) Add:
   - `fabric-plugin.json` (manifest),
   - `bundle/index.esm.js` (ESM),
   - `bundle/sbom.json` (CycloneDX),
   - `README.md`, `LICENSE`, optional `screenshots/`.
3) Open PR. CI validates, updates registry, **keyless-signs** artifacts on merge to `main`.

Local sanity:
  cp .env.example .env
  npm ci
  npm run validate
