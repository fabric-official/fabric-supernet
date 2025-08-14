param([switch]$Quiet, [switch]$NoBuild)
$ErrorActionPreference="Stop"
$node = (Get-Command node -ErrorAction SilentlyContinue)
if (-not $node) { throw "Node.js is required in PATH to run runtime/mint-runtime.js" }
$args = @()
if ($NoBuild -or $env:SUPERNET_SKIP_BUILD -eq '1') { $args += '--no-build' }
& node .\runtime\mint-runtime.js @args | ForEach-Object { if(-not $Quiet){ $_ } }
