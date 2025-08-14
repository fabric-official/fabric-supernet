# SuperNet build readiness

## Status
* ✅ runtime mint façade (runtime/mint-runtime.* present)
* ✅ staged pkg-*/ in artifacts/staging (minted/packaged bundle)
* ✅ staged NetworkAgent minting sources (kernel/manager/loader)
* ✅ policies/ directory with machine-enforceable bundles
* ✅ policy regression tests (tests/policy)
* ✅ LaptopAgent OS hooks (agents/laptop/os-hooks/<win|mac|linux>)
* ✅ WiFiAgent firmware scaffold (agents/wifi/firmware/)
* ✅ DroneAgent firmware/images (agents/drone/firmware|images)
* ✅ Mobile scaffolds (apps/mobile-android|apps/mobile-ios)
* ✅ Desktop host app (apps/desktop)
* ✅ Provenance client service (services/provenance-client)
* ✅ DAG Explorer service (services/dag-explorer)
* ✅ Treasury bridge service (services/treasury-bridge)
* ✅ UDAP pairing service (services/udap)
* ✅ fabpkg exporter (tools/fabpkg.ps1)
* ❌ release workflow (.github/workflows/release.yml)
* ✅ no simulated_logs/ in repo root
* ❌ weights base present (weights/base/*.bin)
* ❌ weights minted present (weights/minted/**)

## Next to implement
1. Add .github/workflows/release.yml (SLSA/Cosign attestation, signed releases).
2. Ensure base weights exist under /weights/base/*.bin (10100MB per agent).
3. Ensure minted weights under /weights/minted/epoch-*/ are produced by your pack/mint path.
