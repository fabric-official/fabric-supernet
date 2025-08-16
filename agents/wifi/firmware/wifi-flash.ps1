<#
.SYNOPSIS
  OpenWrt/RouterOS firmware operations: verify, backup, upload, flash, and post-verify.
  Requires: ssh/scp on PATH and credentials to the device.
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][string]$ImagePath,
  [string]$Host = "192.168.1.1",
  [string]$User = "root",
  [switch]$BackupOnly,
  [switch]$DryRun
)
$ErrorActionPreference='Stop'

function Run($cmd){
  Write-Host ">> $cmd"
  if(-not $DryRun){ & cmd /c $cmd; if($LASTEXITCODE -ne 0){ throw "cmd failed: $cmd" } }
}

if(-not (Test-Path -LiteralPath $ImagePath)){ throw "Image not found: $ImagePath" }
$image = (Resolve-Path -LiteralPath $ImagePath).Path

# sha256
$sha = (Get-FileHash -Algorithm SHA256 -LiteralPath $image).Hash.ToLower()
Write-Host "[hash] $sha  $image"

# ensure ssh/scp
foreach($t in 'ssh','scp'){ if(-not (Get-Command $t -ErrorAction SilentlyContinue)){ throw "$t not found in PATH" } }

# backup
$ts = Get-Date -Format yyyyMMdd-HHmmss
$backup = "backup-$Host-$ts.tar.gz"
Run "ssh $User@$Host 'sysupgrade -b /tmp/$backup'"
Run "scp $User@$Host:/tmp/$backup ."

if($BackupOnly){ Write-Host "[backup] saved $backup"; exit 0 }

# upload and flash (OpenWrt sysupgrade)
Run "scp `"$image`" $User@$Host:/tmp/firmware.img"
Run "ssh $User@$Host 'sysupgrade -n /tmp/firmware.img'"

# post-verify (wait and ping)
Start-Sleep 20
$ok = Test-Connection -ComputerName $Host -Count 2 -Quiet
if(-not $ok){ Write-Host "[WARN] device not pinging yet"; }
Write-Host "[flash] completed for $Host"
