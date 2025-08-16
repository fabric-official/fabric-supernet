# fab_cli Merge Notes
- Base: user's original archive
- Overlay: production adaptations
- All overwritten files were backed up with `.orig` alongside the new version.

## Changed files:
- package.json — overwrote (backup .orig)
- tsconfig.json — overwrote (backup .orig)
- Dockerfile — added
- README.md — added
- src/utils.ts — added
- src/index.ts — overwrote (backup .orig)
- src/commands/init.ts — added
- src/commands/build.ts — added
- src/commands/deploy.ts — added
- src/commands/model.ts — overwrote (backup .orig)
- src/commands/audit.ts — added
- src/commands/compliance.ts — overwrote (backup .orig)
- src/commands/monitor.ts — overwrote (backup .orig)
- src/test/smoke.ts — added
- scripts/gen-completions.js — added
- .github/workflows/fab_cli-ci.yml — added