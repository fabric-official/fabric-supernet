
# Keyless Signing (Sigstore/cosign + GitHub OIDC)

- CI signs plugin bundles and the registry using **cosign keyless** (no private keys).
- Outputs both `.sig` (detached signature) and `.sigstore` (Sigstore bundle with cert + Rekor proof).
- Supernet verifies with **sigstore-js** and enforces GH OIDC identity (this repo, main branch).

See `.github/workflows/validate-and-publish.yml` for exact steps.
