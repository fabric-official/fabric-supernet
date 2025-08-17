
# Fabric Supernet — Open-Source Plugin App Store

This repository is the **public, open-source registry of Supernet plugins**. The Supernet dashboard reads this repo **directly from GitHub** — no servers are involved. Plugins are free; value flows via **agent royalties + XP**, not plugin purchases.

## What’s here
- `registry/index.json` — **signed** catalog of plugins.
- `plugins/<publisher>.<name>/` — each plugin’s manifest, signed bundle, SBOM, docs.
- `schemas/` — JSON Schemas for validation.
- `scripts/` — CI utilities to validate, sign, and update the registry.
- `.github/workflows/` — PR + publish pipelines (keyless).

See `PUBLISHER_GUIDE.md` and `KEYLESS_SIGNING.md`.
