# fab_cli (Production-Grade)

Commands:
- `fab init` — scaffold config
- `fab build` — compile Fab files to IR
- `fab deploy` — push manifest + weights to model_registry
- `fab model (push|pull|list)` — registry operations
- `fab audit` — provenance health
- `fab compliance --profile <PROFILE>` — generate report
- `fab monitor` — live health of SuperNet agents

## Install / Build
```bash
npm install
npm run build
npm link   # optional, to install `fab` on PATH
```

## Config
`fabric.config.yaml`:
```yaml
registryBase: http://localhost:8090
economyBase: http://localhost:8095
provenanceLedger: http://localhost:8084
```

## Docker
```bash
docker build -t ghcr.io/example/fabric/fab-cli:1.0.0 fab_cli
docker run --rm -v %CD%:/work -w /work ghcr.io/example/fabric/fab-cli:1.0.0 fab build
```
