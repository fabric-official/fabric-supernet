<#
  OsHooks-Windows.ps1
  Safe hook: ONLY writes a self-test entry and exits (no auto-start).
  Add your own runner if you need continuous monitoring.
#>
param([switch]$SelfTest)
$ErrorActionPreference='Stop'
$logDir = 'artifacts\audit'
if(-not (Test-Path $logDir)){ New-Item -ItemType Directory -Force -Path $logDir | Out-Null }
$log = Join-Path $logDir "os-hooks-win-$(Get-Date -Format yyyyMMdd-HHmmss).log"
if($SelfTest){
  "{0} SELFTEST Windows ok" -f (Get-Date -Format o) | Out-File -Encoding utf8 $log
  Write-Host "[win] wrote $log"
  exit 0
}else{
  Write-Host "[win] This script does nothing unless you pass -SelfTest"
  exit 0
}
