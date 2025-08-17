
# Contributing Plugins

We accept **open-source** plugins that comply with our security & licensing rules.

## Layout
plugins/<publisher>.<name>/
  fabric-plugin.json
  bundle/
    index.esm.js
    index.esm.js.sig
    index.esm.js.sigstore
    sbom.json
  README.md
  screenshots/*.png (optional)
  LICENSE

## Requirements
- Manifest validates (`schemas/fabric-plugin.schema.json`).
- Bundle is **ESM**, **signed (keyless)**, has **CycloneDX SBOM**.
- No secrets in code/artifacts.
- OSI license (MIT/Apache-2.0 recommended).
- One plugin/version bump per PR.
