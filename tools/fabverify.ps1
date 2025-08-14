#requires -Version 5.1
$ErrorActionPreference = "Stop"
param(
  [Parameter(Mandatory=$true)][string]$ZipPath,
  [string]$Dest = (Join-Path (Split-Path -Parent $ZipPath) ("extracted-" + [IO.Path]::GetFileNameWithoutExtension($ZipPath))),
  [switch]$Provenance
)

function Get-BodyShaHex([byte[]]$bytes){ $sha=[Security.Cryptography.SHA256]::Create(); (($sha.ComputeHash($bytes)|%{$_.ToString("x2")})-join"").ToUpper() }
function New-Nonce { -join ((48..57)+(97..122) | Get-Random -Count 24 | ForEach-Object {[char]$_}) }
function New-HmacSig([byte[]]$key,[string]$m,[string]$p,[string]$ts,[string]$n,[string]$b){
  $base="$m`n$p`n$ts`n$n`n$b"; $h=[Security.Cryptography.HMACSHA256]::new($key)
  (($h.ComputeHash([Text.Encoding]::UTF8.GetBytes($base))|%{$_.ToString("x2")})-join"").ToUpper()
}

# 1) Explode ZIP to a temp area
$tmp = Join-Path ([IO.Path]::GetTempPath()) ("fabv-"+[guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force -Path $tmp | Out-Null
Expand-Archive -Path $ZipPath -DestinationPath $tmp -Force

# 2) Find SHA256SUMS.txt and verify all files
$sum = Get-ChildItem -LiteralPath $tmp -Recurse -Filter "SHA256SUMS.txt" | Select-Object -First 1
if(-not $sum){ throw "SHA256SUMS.txt not found in package." }
$sumLines = Get-Content -LiteralPath $sum.FullName -Encoding UTF8
$fail = @()
foreach($line in $sumLines){
  if(-not $line.Trim()){ continue }
  $parts = $line -split "\s\s+",2
  if($parts.Count -lt 2){ $fail += "Malformed line: $line"; continue }
  $want = $parts[0].Trim().ToUpper()
  $rel  = $parts[1].Trim() -replace "/","\"
  $file = Join-Path $tmp $rel
  if(-not (Test-Path -LiteralPath $file)){ $fail += "Missing: $rel"; continue }
  $have = (Get-FileHash -Algorithm SHA256 -LiteralPath $file).Hash.ToUpper()
  if($have -ne $want){ $fail += "Hash mismatch: $rel"; continue }
}
if($fail.Count){
  $fail | ForEach-Object { Write-Host $_ -ForegroundColor Red }
  throw "Checksum verification failed."
}
Write-Host "OK: checksums verified" -ForegroundColor Green

# 3) Optional: confirm SHA256SUMS.txt hash exists in local provenance
if($Provenance){
  $cfgDir = Join-Path (Split-Path -Parent $PSScriptRoot) "services\provenance-client\config"
  $sec = Join-Path $cfgDir "secret.key"
  if(Test-Path $sec){
    $bytes = [IO.File]::ReadAllBytes($sum.FullName)
    $sumSha = Get-BodyShaHex $bytes
    $key  = [byte[]](Get-Content -Encoding Byte -Path $sec)
    $ts   = (Get-Date).ToUniversalTime().ToString("o")
    $nonce= New-Nonce
    $sig  = New-HmacSig $key "GET" "/entry/1" $ts $nonce (Get-BodyShaHex ([byte[]]@()))
    # fetch last id (naive: keep calling /entry/{i+1} until 404); stop if we find matching sha
    $i = 1
    $found = $false
    while($true){
      try{
        $ts=(Get-Date).ToUniversalTime().ToString("o"); $nonce=New-Nonce; $sig=New-HmacSig $key "GET" "/entry/$i" $ts $nonce (Get-BodyShaHex ([byte[]]@()))
        $e = Invoke-RestMethod "http://127.0.0.1:8088/entry/$i" -Headers @{ "x-ts"=$ts; "x-nonce"=$nonce; "x-sig"=$sig }
        if($e.sha -eq $sumSha){ $found = $true; break }
        $i++
      } catch { break }
    }
    if($found){ Write-Host "OK: provenance contains SHA256SUMS (entry $i)" -ForegroundColor Green }
    else     { Write-Warning "Provenance check: SHA not found (this build may not have been appended)" }
  } else { Write-Warning "Provenance skipped: secret.key not found" }
}

# 4) Install: move verified files to destination
if(Test-Path $Dest){ Remove-Item -Recurse -Force $Dest }
New-Item -ItemType Directory -Force -Path $Dest | Out-Null
Copy-Item -LiteralPath (Join-Path $tmp "*") -Destination $Dest -Recurse -Force
Remove-Item -Recurse -Force $tmp
Write-Host "OK: extracted to $Dest" -ForegroundColor Green