Fabric Dev Licenses (HS256, OFFLINE TESTING ONLY)
=================================================

Contents:
- licenses/LIC-0001-HOME.fablic        (3 seats, pkg supernet-home)
- licenses/LIC-0002-PRO.fablic         (25 seats, pkg supernet-pro)  — REVOKED in crl.json
- licenses/LIC-0003-ENTERPRISE.fablic  (250 seats, pkg supernet-enterprise)
- crl.json                              (revokes LIC-0002-PRO for testing)
- DEV_LICENSE_SECRET.txt                (HS256 dev secret + kid)

Usage:
1) Place *.fablic files into your host data path:  %APPDATA%/Fabric/licenses/   (Windows)
   or $XDG_DATA_HOME/Fabric/licenses/ (Linux), ~/Library/Application Support/Fabric/licenses/ (macOS)
2) Place crl.json under %APPDATA%/Fabric/crl.json (or OS equivalent).
3) Configure host DEV acceptance (**never enable in production**):
   - set env: FAB_DEV_LICENSES=1
   - set env: HS256_DEV_KID=dev-20250816
   - set env: HS256_DEV_SECRET=dev-fabric-license-secret-2025-08-16-DoNotUseInProduction

Host must enforce:
- If FAB_DEV_LICENSES != 1, reject HS256 licenses. Only EdDSA (Ed25519) CA-signed licenses allowed.
- CRL must be applied to block revoked licenses (LIC-0002-PRO).

Timestamps:
- iat/nbf: 2025-08-16T19:00:00+00:00
- exp: 2027-08-16T19:00:00+00:00

This pack is for wiring the full flow end-to-end. Replace with Ed25519 (EdDSA) CA-signed licenses for production.
