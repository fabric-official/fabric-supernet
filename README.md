# Fabric SuperNet — Production Package (v1)

This repository contains seven Fabric agents packaged as independent, production-grade models.
Each agent is buildable via CMake, has a policy seal, treasury enforcement, and per-agent weights folder.

## Build all agents
```bash
./compile.sh              # Unix
.\compile.bat             # Windows
```

## Train weights (scaffolds)
See `training/` for per-agent training notes. Replace weights in each `agents/<Agent>/weights/` folder.


**Final total weights size:** 192.00 MB (spec-compliant)
