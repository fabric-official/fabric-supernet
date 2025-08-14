param(
  [Parameter(Mandatory=$true)][string]$Source, # folder to package
  [Parameter(Mandatory=$true)][string]$Out     # output .zip path
)
$ErrorActionPreference = "Stop"
if(-not (Test-Path -LiteralPath $Source)){ throw "Source not found: $Source" }
$srcDir  = (Resolve-Path -LiteralPath $Source).Path
$destDir = Split-Path -Parent $Out
if(-not (Test-Path -LiteralPath $destDir)){ New-Item -ItemType Directory -Force -Path $destDir | Out-Null }
$zipPath = Join-Path (Resolve-Path -LiteralPath $destDir) (Split-Path -Leaf $Out)
Add-Type -AssemblyName "System.IO.Compression.FileSystem"
if(Test-Path -LiteralPath $zipPath){ Remove-Item -LiteralPath $zipPath -Force }
[IO.Compression.ZipFile]::CreateFromDirectory($srcDir, $zipPath)
Write-Host "[fabpkg] wrote $zipPath"
