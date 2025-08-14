#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
PY=python3
for A in FabricGovernor AtomicMemoryDBAgent WiFiAgent NetworkAgent DroneAgent LaptopAgent SmartphoneAgent; do
  echo "== Train $A =="
  "$PY" "$HERE/training/$A/train.py" --out "$HERE/agents/$A/weights" || true
  WF=$(ls -1t "$HERE/agents/$A/weights" | head -n1 || true)
  if [ -n "$WF" ]; then "$PY" "$HERE/tools/update_digest.py" "$HERE/agents/$A/model.yaml" "$HERE/agents/$A/weights/$WF"; fi
done
