param(
  [string]$StagingRoot = ".\artifacts\staging",
  [string]$BuildRoot   = ".\build\supernet",
  [string]$OutZip      = ".\artifacts\release\supernet.fabpkg.zip"
)
$ErrorActionPreference='Stop'
function Fail($m){ Write-Host "[FAIL] $m"; exit 1 }
function Ok($m){ Write-Host "[OK] $m" }

# 1) latest staged pkg
$pkg = Get-ChildItem -Path $StagingRoot -Directory -Filter "pkg-*" -ErrorAction SilentlyContinue |
       Sort-Object LastWriteTime -Descending | Select-Object -First 1
if(-not $pkg){ Fail "No $StagingRoot\pkg-* found. Build staging first: node .\runtime\mint-runtime.js --no-build" }
Ok "staged: $($pkg.FullName)"

# 2) copy pkg -> build/supernet/pkg-current
if(-not (Test-Path $BuildRoot)){ New-Item -ItemType Directory -Force -Path $BuildRoot | Out-Null }
$dest = Join-Path $BuildRoot 'pkg-current'
if(Test-Path $dest){ Remove-Item -Recurse -Force $dest }
Copy-Item -Recurse -Force -Path $pkg.FullName -Destination $dest
Ok "pkg copied to $dest"

# 3) manifest
$manifest = @{
  builtAt       = (Get-Date).ToString("s")
  sourcePackage = $pkg.Name
  sourcePath    = $pkg.FullName
  repo          = (git remote get-url origin 2>$null)
  branch        = (git rev-parse --abbrev-ref HEAD 2>$null)
  commit        = (git rev-parse HEAD 2>$null)
}
$enc = New-Object System.Text.UTF8Encoding($false)
[IO.File]::WriteAllText((Join-Path $BuildRoot 'manifest.json'), ($manifest | ConvertTo-Json -Depth 6), $enc)
Ok "manifest written"

# 4) hardening: non-empty, weight sizes, no placeholders, required sources
$files = Get-ChildItem -Recurse -File -LiteralPath $dest -ErrorAction SilentlyContinue
if(($files | Measure-Object).Count -lt 10){ Fail "pkg-current empty or too small" }

# weight rules: governor ~100MB (±5MB), others ~10MB (>=10MB and <=20MB)
$wdir = Join-Path $dest 'weights\base'
$weights = 'governor.bin','memorydb.bin','wifi.bin','network.bin','drone.bin','laptop.bin','smartphone.bin'
foreach($w in $weights){
  $p = Join-Path $wdir $w
  if(-not (Test-Path $p)){ Fail "missing weight: $w" }
  $len = (Get-Item $p).Length
  $mb  = [Math]::Round($len/1MB,2)
  if($w -eq 'governor.bin'){
    if(-not ($len -ge 95MB -and $len -le 105MB)){ Fail "governor.bin must be ~100MB (±5MB). Found $mb MB" }
  } else {
    if(-not ($len -ge 10MB -and $len -le 20MB)){ Fail "$w must be ~10MB (10–20MB). Found $mb MB" }
  }
}
Ok "weights validated (gov ~100MB, others ~10MB)"

# placeholder scan (PS5.1-safe: recurse via Get-ChildItem then Select-String)
$bad = @('stub','TODO','TBD','placeholder','Replace with real','shim')
$matches = @()
$allTextFiles = Get-ChildItem -Recurse -File -LiteralPath $dest -ErrorAction SilentlyContinue
foreach($b in $bad){
  $matches += $allTextFiles | Select-String -Pattern $b -SimpleMatch -ErrorAction SilentlyContinue
}
if($matches.Count -gt 0){
  $matches | Select-Object Path,LineNumber,Line | Format-Table -AutoSize | Out-String | Write-Host
  Fail "placeholder strings detected in pkg-current"
}
Ok "no placeholder strings found"

# required minting sources present (anywhere in pkg)
foreach($nf in 'minting_kernel.cpp','minting_manager.cpp','weight_loader.cpp'){
  $hit = Get-ChildItem -Recurse -File -LiteralPath $dest -Filter $nf -ErrorAction SilentlyContinue | Select-Object -First 1
  if(-not $hit){ Fail "required file missing: $nf" }
}
Ok "minting sources present"

# 6) package
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\fabpkg.ps1 -Source $dest -Out $OutZip
Ok "packaged: $OutZip"
