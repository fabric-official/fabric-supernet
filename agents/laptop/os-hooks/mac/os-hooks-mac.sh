#!/usr/bin/env bash
# os-hooks-mac.sh
# Safe hook: supports a --self-test that writes a line and exits.
set -euo pipefail
LOG="artifacts/audit/os-hooks-mac-$(date +%Y%m%d-%H%M%S).log"
mkdir -p "$(dirname "$LOG")"
if [[ "${1:-}" == "--self-test" ]]; then
  /bin/date -u +"%Y-%m-%dT%H:%M:%SZ SELFTEST macOS ok" > "$LOG"
  echo "[mac] wrote $LOG"
  exit 0
fi
echo "[mac] This script is inert unless run on macOS with --self-test or your runner."
exit 0
