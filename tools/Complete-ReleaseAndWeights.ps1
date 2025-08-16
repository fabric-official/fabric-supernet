# tools/Complete-ReleaseAndWeights-Fixed.ps1
# Idempotent: ensures base/minted weights and .github/workflows/release.yml (SLSA + Cosign)

$ErrorActionPreference = 'Stop'

# --- Resolve repo root safely ---
function Get-RepoRoot {
  try {
    $p = (git rev-parse --show-toplevel 2>$null)
    if ($LASTEXITCODE -eq 0 -and $p) { return $p.Trim() }
  } catch {}
  return (Get-Location).Path
}
$Repo = Get-RepoRoot
Set-Location $Repo

# --- Helpers (absolute-path safe) ---
function Ensure-Dir([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Force -Path $Path | Out-Null
  }
}
function Write-Utf8NoBom([string]$Path, [string]$Content) {
  $dir = Split-Path -Parent $Path
  if ($dir) { Ensure-Dir $dir }
  $enc = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $enc)
}

Write-Host "[repo] $Repo" -ForegroundColor Cyan

# --- A) Weights scaffolding (absolute paths) ---
$WeightsBase   = Join-Path $Repo 'weights\base'
$WeightsMinted = Join-Path $Repo 'weights\minted'
Ensure-Dir $WeightsBase
Ensure-Dir $WeightsMinted

$agents = 'governor','memorydb','wifi','network','drone','laptop','smartphone'
foreach ($a in $agents) {
  $file = Join-Path $WeightsBase ("{0}.bin" -f $a)
  if (-not (Test-Path -LiteralPath $file)) {
    $size = 10MB
    Ensure-Dir (Split-Path -Parent $file)
    $fs = [System.IO.File]::Open($file, [System.IO.FileMode]::Create)
    try {
      $buf = New-Object byte[] $size
      (New-Object System.Random).NextBytes($buf)
      $fs.Write($buf,0,$buf.Length)
    } finally { $fs.Close() }
    Write-Host "Created base weight: $file (10MB)"
  }
}

# --- B) Verify mint façade exists ---
if (-not (Test-Path (Join-Path $Repo 'runtime\mint-runtime.ps1')) -or -not (Test-Path (Join-Path $Repo 'runtime\mint-runtime.js'))) {
  throw "runtime\mint-runtime.* not found in $Repo\r`nAdd the zero-compiler façade first."
}

# --- C) Release workflow (SLSA + Cosign, Windows pack + Ubuntu sign) ---
$WorkflowDir = Join-Path $Repo '.github\workflows'
Ensure-Dir $WorkflowDir
$ReleaseYmlPath = Join-Path $WorkflowDir 'release.yml'

$releaseYml = @'
name: Release SuperNet

on:
  push:
    tags:
      - "v*"
  workflow_dispatch:

permissions:
  contents: write
  id-token: write    # keyless signing + SLSA
  attestations: write

jobs:
  package:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Mint facade (verify-only)
        shell: pwsh
        run: |
          $env:SUPERNET_SKIP_BUILD = '1'
          powershell -NoProfile -ExecutionPolicy Bypass -File .\runtime\mint-runtime.ps1 -NoBuild

      - name: Find latest staged pkg
        id: findpkg
        shell: pwsh
        run: |
          $latest = Get-ChildItem -Path "artifacts\staging" -Directory -Filter "pkg-*" |
            Sort-Object LastWriteTime -Descending | Select-Object -First 1
          if (-not $latest) { throw "No staged pkg-* found under artifacts/staging" }
          "pkgPath=$($latest.FullName)" | Out-File -FilePath $env:GITHUB_OUTPUT -Append -Encoding utf8
          "pkgName=$($latest.Name)"     | Out-File -FilePath $env:GITHUB_OUTPUT -Append -Encoding utf8

      - name: Make release zip
        id: zip
        shell: pwsh
        run: |
          $pkgPath = "${{ steps.findpkg.outputs.pkgPath }}"
          $name    = "${{ steps.findpkg.outputs.pkgName }}"
          $outDir  = "artifacts\release"
          New-Item -ItemType Directory -Force -Path $outDir | Out-Null
          $zipPath = Join-Path $outDir ("{0}.zip" -f $name)
          Add-Type -AssemblyName 'System.IO.Compression.FileSystem'
          if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
          [System.IO.Compression.ZipFile]::CreateFromDirectory($pkgPath, $zipPath)
          "zipPath=$zipPath" | Out-File -FilePath $env:GITHUB_OUTPUT -Append -Encoding utf8

      - name: Upload artifact (zip)
        uses: actions/upload-artifact@v4
        with:
          name: supernet-pkg
          path: ${{ steps.zip.outputs.zipPath }}

  sign_and_release:
    needs: package
    runs-on: ubuntu-latest
    permissions:
      contents: write
      id-token: write
      attestations: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: supernet-pkg
          path: dist
      - run: ls -lah dist

      - name: Generate SLSA provenance
        id: slsa
        uses: slsa-framework/slsa-github-generator/actions/generator@v2
        with:
          artifact_path: dist
          upload_output: true

      - name: Install Cosign
        uses: sigstore/cosign-installer@v3

      - name: Cosign sign (keyless or key-based)
        env:
          COSIGN_EXPERIMENTAL: "1"
          COSIGN_PRIVATE_KEY: ${{ secrets.COSIGN_PRIVATE_KEY }}
          COSIGN_PASSWORD: ${{ secrets.COSIGN_PASSWORD }}
        run: |
          set -euo pipefail
          for f in dist/*.zip; do
            if [ -n "${COSIGN_PRIVATE_KEY:-}" ]; then
              echo "${COSIGN_PRIVATE_KEY}" > private.key
              echo "${COSIGN_PASSWORD:-}" | cosign sign-blob --key private.key --yes "$f" > "$f.sig"
            else
              cosign sign-blob --yes "$f" > "$f.sig"
            fi
            sha256sum "$f" > "$f.sha256"
          done

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          files: |
            dist/*.zip
            dist/*.zip.sig
            dist/*.zip.sha256
            ${{ steps.slsa.outputs.attestation }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
'@

Write-Utf8NoBom $ReleaseYmlPath $releaseYml
Write-Host "[workflow] wrote $ReleaseYmlPath" -ForegroundColor Green

# --- D) Commit & push ---
git add ".github/workflows/release.yml" "weights/base" "weights/minted" | Out-Null
git commit -m "release(ci): add signed release workflow (SLSA+Cosign) + ensure base/minted weights scaffolding" | Out-Null
git push | Out-Null
Write-Host "`n[DONE] Release workflow + weights scaffolding committed and pushed." -ForegroundColor Green

