
# Security Policy

- Report vulnerabilities via GitHub Security Advisories.
- Registry and plugin bundles are **keyless-signed** (Sigstore/cosign).
- CI enforces:
  - JSON Schema validation for registry & manifests.
  - CycloneDX SBOM presence.
  - Basic secret scans.
- Plugins run in Supernet with **sandbox + capability gates**. They never hold keys nor sign directly.
