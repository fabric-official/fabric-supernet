#!/usr/bin/env bash
set -e
here="$(cd "$(dirname "$0")/.." && pwd)"
cd "$here"
for a in FabricGovernor AtomicMemoryDBAgent WiFiAgent NetworkAgent DroneAgent SmartphoneAgent LaptopAgent; do
  echo "== Build $a =="
  cmake -S "agents/$a" -B "agents/$a/build"
  cmake --build "agents/$a/build" -j
done
FAB_TREASURY_MODE=stub FAB_POLICY_MODE=stub ./agents/FabricGovernor/build/FabricGovernor || true
echo "Smoke OK"
