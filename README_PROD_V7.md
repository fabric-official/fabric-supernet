# SuperNet PRODUCTION V7

**This package is production-complete and self-contained.**
- 7 agents (Governor, AtomicMemoryDB, WiFi, Network, Drone, Smartphone, Laptop)
- Deterministic **real training scripts** (folds dataset content if present)
- Concrete **treasury/policy runtime** (local ledger + rules), linked in every agent
- **E2E script**: builds all agents, trains all weights, runs Governor, verifies pipeline

## Quick Start (Windows)
1. Install CMake + a C++17 toolchain + Python 3.
2. `scripts\e2e.bat`

## Quick Start (Linux/macOS)
1. `chmod +x scripts/e2e.sh`
2. `./scripts/e2e.sh`

## Treasury/Policy
- Ledger written to `runtime/state/treasury_ledger.json` (one JSON per line).
- Policy rules per agent: `agents/<Agent>/policy.rules`.
