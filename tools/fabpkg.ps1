param(
  [string]$Input = ".\\build\\supernet\\pkg-current",
  [string]$Out   = ".\\artifacts\\release\\supernet.fabpkg.zip"
)
$ErrorActionPreference = "Stop"
if (-not (Test-Path $Input)) { throw "Input not found: $Input" }
$dir = Split-Path -Parent $Out
if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
Add-Type -AssemblyName "System.IO.Compression.FileSystem"
if (Test-Path $Out) { Remove-Item $Out -Force }
[IO.Compression.ZipFile]::CreateFromDirectory((Resolve-Path $Input), (Resolve-Path $Out))
Write-Host "[fabpkg] wrote $Out"