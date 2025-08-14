param([string]$PolicyPath = ".\policies\laptop.default.json",[switch]$Once)
$ErrorActionPreference="Stop"
function Read-Json([string]$p){ (Get-Content -Raw -LiteralPath $p | ConvertFrom-Json) }
if(-not (Test-Path $PolicyPath)){ Write-Host "[warn] policy not found: $PolicyPath"; }
$logDir = "artifacts/audit"; if(-not (Test-Path $logDir)){ New-Item -ItemType Directory -Force -Path $logDir | Out-Null }
$log = Join-Path $logDir "approval-dryrun-$(Get-Date -Format yyyyMMdd-HHmmss).log"
"DRY-RUN daemon started $(Get-Date -Format o)" | Out-File -Encoding utf8 $log
function Probe(){
  $cpu = (Get-Counter '\Processor(_Total)\% Processor Time').CounterSamples.CookedValue
  Add-Content -Encoding utf8 $log ("{0} cpu={1:N1}%" -f (Get-Date -Format o), $cpu)
}
if($Once){ Probe; Write-Host "[dryrun] once complete -> $log"; exit 0 }
Write-Host "[dryrun] running; does not kill or block any process. Logging to $log"
while($true){ Probe; Start-Sleep 5 }
