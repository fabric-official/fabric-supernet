
#!/usr/bin/env bash
set -e
here="$(cd "$(dirname "$0")/.." && pwd)"
cd "$here"

# Build agents
for a in FabricGovernor AtomicMemoryDBAgent WiFiAgent NetworkAgent DroneAgent SmartphoneAgent LaptopAgent; do
  echo "== Build $a =="
  cmake -S "agents/$a" -B "agents/$a/build"
  cmake --build "agents/$a/build" -j
done

# Train (deterministic; folds dataset if files exist)
for a in FabricGovernor AtomicMemoryDBAgent WiFiAgent NetworkAgent DroneAgent SmartphoneAgent LaptopAgent; do
  echo "== Train $a =="
  python3 "training/$a/train.py"
done

# Run simple boot for governor (policy allows 'boot')
"./agents/FabricGovernor/build/FabricGovernor"

echo "E2E OK"
