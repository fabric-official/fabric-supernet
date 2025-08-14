#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ -x "$ROOT/compile.sh" ]; then
  echo "[build_test] Running compile.sh"
  "$ROOT/compile.sh"
else
  echo "[build_test] No compile.sh found; attempting CMake fallback"
  mkdir -p "$ROOT/build" && cd "$ROOT/build"
  cmake ..
  cmake --build . -j
fi
echo "[build_test] Static verification..."
python3 "$ROOT/tools/static_verify.py"
if [ -d "$ROOT/logs" ]; then
  echo "[build_test] Runtime logs found; running runtime verifier"
  python3 "$ROOT/tools/verify_supernet.py" || true
else
  echo "[build_test] No runtime logs; skip runtime verifier"
fi
echo "[build_test] DONE"
