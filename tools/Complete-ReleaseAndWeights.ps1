# tools/Complete-ReleaseAndWeights.ps1
# Completes release workflow + base/minted weights. Idempotent.

$ErrorActionPreference = 'Stop'

function Write-Utf8NoBom($Path, $Content) {
  $dir = Split-Path -Parent $Path
  if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  $enc = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $enc)
}

# --- A) Weights: ensure base + minted dirs exist; create small base seeds if missing ---
$agents = @(
  'governor','memorydb','wifi','network','drone','laptop','smartphone'
)

if (-not (Test-Path 'weights\base'))   { New-Item -ItemType Directory -Force -Path 'weights\base'   | Out-Null }
if (-not (Test-Path 'weights\minted')) { New-Item -ItemType Directory -Force -Path 'weights\minted' | Out-Null }

foreach ($a in $agents) {
  $file = Join-Path 'weights\base' ("{0}.bin" -f $a)
  if (-not (Test-Path $file)) {
    # 10 MB random seed per agent (placeholder — replace with real weights when available)
    $size = 10MB
    $fs = [System.IO.File]::Open($file, [System.IO.FileMode]::Create)
    try {
      $buf = New-Object byte[] $size
      (New-Object System.Random).NextBytes($buf)
      $fs.Write($buf,0,$buf.Length)
    } finally { $fs.Close() }
    Write-Host "Created base weight: $file (10MB)"
  }
}

# --- B) Make sure mint façade exists (you already added it, but we won't assume) ---
if (-not (Test-Path 'runtime\mint-runtime.ps1') -or -not (Test-Path 'runtime\mint-runtime.js')) {
  throw "runtime\mint-runtime.* not found. Add the zero-compiler façade first."
}

# --- C) GitHub Actions: release workflow with SLSA + Cosign ---
$releaseYml = @'
name: Release SuperNet

on:
  push:
    tags:
      - "v*"
  workflow_dispatch:

permissions:
  contents: write
  id-token: write   # required for keyless signing + SLSA
  attestations: write

jobs:
  package:
    runs-on: windows-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Mint facade (verify-only)
        shell: pwsh
        run: |
          $env:SUPERNET_SKIP_BUILD = '1'  # no compiler on runner required
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
          Write-Host "ZIP: $zipPath"
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
      - name: Checkout
        uses: actions/checkout@v4

      - name: Download packaged artifact
        uses: actions/download-artifact@v4
        with:
          name: supernet-pkg
          path: dist

      - name: List files
        run: ls -lah dist

      # --- SLSA provenance (subject: the ZIP we just produced) ---
      - name: Generate SLSA provenance
        id: slsa
        uses: slsa-framework/slsa-github-generator/actions/generator@v2
        with:
          artifact_path: dist
          upload_output: true

      # --- Cosign install ---
      - name: Install Cosign
        uses: sigstore/cosign-installer@v3

      # Keyless by default (OIDC); if COSIGN_PRIVATE_KEY is set, we do key-based signing instead.
      - name: Cosign sign (keyless or key-based)
        env:
          COSIGN_EXPERIMENTAL: "1"
          COSIGN_PRIVATE_KEY: ${{ secrets.COSIGN_PRIVATE_KEY }}
          COSIGN_PASSWORD: ${{ secrets.COSIGN_PASSWORD }}
        run: |
          set -euo pipefail
          for f in dist/*.zip; do
            if [ -n "${COSIGN_PRIVATE_KEY:-}" ]; then
              echo "Signing with key from secret (key-based)"
              echo "${COSIGN_PRIVATE_KEY}" > private.key
              echo "${COSIGN_PASSWORD:-}" | cosign sign-blob --key private.key --yes "$f" > "$f.sig"
            else
              echo "Signing keylessly (OIDC)"
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

Write-Utf8NoBom ".github/workflows/release.yml" $releaseYml

# --- D) Git add/commit/push ---
git add ".github/workflows/release.yml" "weights/base" "weights/minted" | Out-Null
# Don't commit empty minted dir
git add -A | Out-Null
git commit -m "release: add signed release workflow (SLSA + Cosign) and ensure base/minted weights scaffolding" | Out-Null
git push | Out-Null

Write-Host "`n[DONE] Release workflow + weights scaffolding committed and pushed." -ForegroundColor Green
Write-Host " - Workflow: .github/workflows/release.yml"
Write-Host " - Base weights ensured under weights/base/*.bin"
Write-Host " - Minted weights dir ensured under weights/minted/"
