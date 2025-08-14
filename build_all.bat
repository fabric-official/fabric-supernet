param(
  [string]$Root = 'D:\Fabric\SuperNet_PROD_v7'
)

# sanity
$need = @('cmake','ninja','cl','link')
$need | ForEach-Object {
  if (-not (Get-Command $_ -ErrorAction SilentlyContinue)) {
    Write-Error "[ERR] '$_' not found in PATH (open x64 Native Tools for VS 2022)"; exit 1
  }
}

Write-Host "=== CLEAN: per-target CMake caches (safe) ==="
Get-ChildItem -Path $Root -Recurse -Filter 'CMakeLists.txt' -File |
  Where-Object { $_.Directory.FullName -ne $Root } |
  ForEach-Object {
    $dir = $_.Directory.FullName
    $b   = Join-Path $dir 'build'
    $cc  = Join-Path $dir 'CMakeCache.txt'
    $cf  = Join-Path $dir 'CMakeFiles'
    if (Test-Path $b)  { Remove-Item -Recurse -Force $b }
    if (Test-Path $cc) { Remove-Item -Force $cc }
    if (Test-Path $cf) { Remove-Item -Recurse -Force $cf }
  }

Write-Host "`n=== PASS 1: Build all C++ targets (CMake + Ninja) ==="
$targets = Get-ChildItem -Path $Root -Recurse -Filter 'CMakeLists.txt' -File |
  Where-Object { $_.Directory.FullName -ne $Root }

if (-not $targets) { Write-Warning "No subdirs with CMakeLists.txt under $Root"; exit 0 }

foreach ($t in $targets) {
  $dir = $t.Directory.FullName
  Write-Host "[C++] $dir"
  Push-Location $dir
  $p = Start-Process -FilePath cmake -ArgumentList @('-S','.', '-B','build','-G','Ninja','-DCMAKE_BUILD_TYPE=Release') -NoNewWindow -PassThru -Wait
  if ($p.ExitCode -ne 0) { Write-Error "cmake configure failed ($dir)"; exit $p.ExitCode }
  $p = Start-Process -FilePath cmake -ArgumentList @('--build','build','-j') -NoNewWindow -PassThru -Wait
  if ($p.ExitCode -ne 0) { Write-Error "cmake build failed ($dir)"; exit $p.ExitCode }
  Pop-Location
}

Write-Host "`n=== PASS 2: Build web apps (Vite) where present ==="
$pkgs = Get-ChildItem -Path $Root -Recurse -Filter 'package.json' -File
foreach ($p in $pkgs) {
  $dir = $p.Directory.FullName
  if (Test-Path (Join-Path $dir 'vite.config.ts')) {
    Write-Host "[WEB] $dir"
    Push-Location $dir
    cmd /c "npm ci"     ; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    cmd /c "npm run build" ; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    Pop-Location
  }
}

Write-Host "`n=== DONE ==="
exit 0



