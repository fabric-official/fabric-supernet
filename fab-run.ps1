param([Parameter(ValueFromRemainingArguments=$true)]$Args)
$Root = $env:SI_PROJECT_ROOT
if (-not $Root) { $Root = "D:\Fabric\fabric-supernet" }
Write-Host "Running Fabric pipeline (shim) for $Root ..."
powershell -NoProfile -ExecutionPolicy Bypass -File "$Root\run-pipeline.ps1" -Root $Root
