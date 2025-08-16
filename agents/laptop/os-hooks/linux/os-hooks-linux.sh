#!/usr/bin/env bash
# os-hooks-linux.sh
# Safe hook: supports a --self-test that writes a line and exits.
set -euo pipefail
LOG="artifacts/audit/os-hooks-linux-$(date +%Y%m%d-%H%M%S).log"
mkdir -p "$(dirname "$LOG")"
if [[ "${1:-}" == "--self-test" ]]; then
  printf "%s SELFTEST Linux ok\n" "$(date --iso-8601=seconds)" > "$LOG"
  echo "[linux] wrote $LOG"
  exit 0
fi
echo "[linux] This script is inert unless run on Linux with --self-test or your runner."
exit 0
