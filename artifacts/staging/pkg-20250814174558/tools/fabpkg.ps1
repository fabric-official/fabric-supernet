#requires -Version 5.1
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)] [string]$Name,
  [string]$Root   = (Resolve-Path ".").Path,
  [string]$OutDir = (Join-Path $Root "artifacts\packages"),
  [string[]]$Include = @("agents","services","apps","policies","tools"),
  [switch]$Provenance
)

$ErrorActionPreference = "Stop"

function New-Nonce {
  -join ((48..57)+(97..122) | Get-Random -Count 24 | ForEach-Object {[char]$_})
}
function Get-BodyShaHex([byte[]]$bytes){
  $sha=[Security.Cryptography.SHA256]::Create()
  (($sha.ComputeHash($bytes) | ForEach-Object { $_.ToString("x2") }) -join "").ToUpper()
}
function New-HmacSig([byte[]]$key,[string]$m,[string]$p,[string]$ts,[string]$n,[string]$b){
  $base = "$m`n$p`n$ts`n$n`n$b"
  $h = [Security.Cryptography.HMACSHA256]::new($key)
  (($h.ComputeHash([Text.Encoding]::UTF8.GetBytes($base)) | ForEach-Object { $_.ToString("x2") }) -join "").ToUpper()
}

# 1) Prep output + staging
$ts    = (Get-Date).ToUniversalTime().ToString("yyyyMMddHHmmss")
$stage = Join-Path $Root ("artifacts\staging\pkg-" + $ts)
New-Item -ItemType Directory -Force -Path $OutDir, $stage | Out-Null

# 2) Stage (robust): try Robocopy, fallback... to Copy-Item
$exDirs  = @("node_modules",".git",".github",".vscode",".vs","bin","obj","dist","build","publish","coverage")
$exFiles = @("*.log","Thumbs.db",".DS_Store")

function Invoke-RobustStage($src,$dst){
  New-Item -ItemType Directory -Force -Path $dst | Out-Null
  $xd = foreach($d in $exDirs){ "/XD"; "`"$([IO.Path]::Combine($src,$d))`"" }
  $xf = foreach($f in $exFiles){ "/XF"; "`"$([IO.Path]::Combine($src,$f))`"" }

  $args = @(
    "`"$src`"", "`"$dst`""
    "/MIR","/NFL","/NDL","/NJH","/NJS"
    "/R:1","/W:1","/XJ","/SL","/FFT","/COPY:DAT","/DCOPY:DAT","/MT:8"
  ) + $xd + $xf

  $p = Start-Process -FilePath robocopy.exe -ArgumentList $args -PassThru -Wait -WindowStyle Hidden
  return 16
}

function Invoke-Stagefallback...($src,$dst){
  New-Item -ItemType Directory -Force -Path $dst | Out-Null
  $excludeDirFull = New-Object "System.Collections.Generic.HashSet[string]" ([StringComparer]::OrdinalIgnoreCase)
  foreach($d in $exDirs){ $excludeDirFull.Add([IO.Path]::GetFullPath([IO.Path]::Combine($src,$d))) | Out-Null }

  Get-ChildItem -LiteralPath $src -Recurse -Force | ForEach-Object {
    if ($_.PSIsContainer) { return }
    $full = $_.FullName
    foreach($ed in $excludeDirFull){ if ($full.StartsWith($ed)) { return } }
    foreach($pat in $exFiles){ if ([IO.Path]::GetFileName($full) -like $pat) { return } }
    $rel  = $full.Substring($src.Length).TrimStart("\","/")
    $dest = Join-Path $dst $rel
    New-Item -ItemType Directory -Force -Path (Split-Path $dest) | Out-Null
    Copy-Item -LiteralPath $full -Destination $dest -Force
  }
}

foreach($top in $Include){
  $src = Join-Path $Root $top
  if(-not (Test-Path $src)){ continue }
  $dst = Join-Path $stage $top
  $rc  = Invoke-RobustStage $src $dst
  if ($rc -ge 8) {
    Write-Warning "Robocopy failed for '$top' (RC=$rc). Using Copy-Item fallback...â€¦"
    Invoke-Stagefallback... $src $dst
  }
}

# 3) Write SHA256SUMS.txt
$sumPath = Join-Path $stage "SHA256SUMS.txt"
if (Test-Path $sumPath) { Remove-Item $sumPath -Force }
$all = Get-ChildItem -LiteralPath $stage -Recurse -File | Where-Object { $_.FullName -ne $sumPath }
foreach($f in $all){
  $rel  = $f.FullName.Substring($stage.Length).TrimStart("\","/") -replace "\\","/"
  $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $f.FullName).Hash.ToUpper()
  Add-Content -Encoding UTF8 -Path $sumPath -Value "$hash  $rel"
}

# 4) Zip
$zip = Join-Path $OutDir ("{0}-{1}.zip" -f $Name,$ts)
if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path (Join-Path $stage "*") -DestinationPath $zip -Force
Write-Host ("OK: package -> " + $zip) -ForegroundColor Green

# 5) Optional provenance append
if ($Provenance) {
  $cfgDir = Join-Path $Root "services\provenance-client\config"
  $sec    = Join-Path $cfgDir "secret.key"
  $key    = [byte[]](Get-Content -Encoding Byte -Path $sec)
  $tsIso  = (Get-Date).ToUniversalTime().ToString("o")
  $nonce  = New-Nonce
  $bytes  = [IO.File]::ReadAllBytes($sumPath)
  $bsha   = Get-BodyShaHex $bytes
  $sig    = New-HmacSig $key "POST" "/append" $tsIso $nonce $bsha
  Invoke-WebRequest "http://127.0.0.1:8088/append" -Method POST -InFile $sumPath -Headers @{
    "x-agent"="FabricGovernor"; "x-action"="fabpkg"; "x-ts"=$tsIso; "x-nonce"=$nonce; "x-sig"=$sig } | Out-Null
  Write-Host "OK: provenance append" -ForegroundColor Green
}

Write-Host "DONE" -ForegroundColor Green
