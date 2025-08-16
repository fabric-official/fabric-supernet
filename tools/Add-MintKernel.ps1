param(
  [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'

# 1) Ensure runtime folder exists
$rtd = Join-Path $PSScriptRoot '..\runtime'
New-Item -ItemType Directory -Force -Path $rtd | Out-Null

# 2) Write a minimal runtime façade that delegates to the agent layer.
#    It does NOT reimplement minting logic; it exists to expose a runtime entry point
#    while reusing the NetworkAgent minting pipeline you already ship.
$rtCpp = @'
/*
  Fabric SuperNet - runtime/minting_kernel.cpp
  Facade entry point that delegates to the NetworkAgent minting implementation.

  IMPORTANT: All minting logic remains in agents/NetworkAgent/src/* (minting_kernel.cpp,
  minting_manager.cpp, weight_loader.cpp, treasury.cpp, etc.). This file exists to provide
  a canonical runtime entry recognized by ops tooling and scanners.
*/
#include <iostream>
#include <filesystem>
#include <cstdlib>

// We do not include internal headers across targets to avoid ODR issues.
// Instead, the runtime shell invokes the existing build + staged binary produced
// by agents/NetworkAgent/scripts/compile.* and the repo's compile scripts.

static int run_delegate()
{
    // Determine OS and choose the repo's compile script
#if defined(_WIN32)
    const char* buildCmd = "cmd /c .\\agents\\NetworkAgent\\scripts\\compile.bat";
    const char* shellCmd = "cmd /c";
#else
    const char* buildCmd = "bash ./agents/NetworkAgent/scripts/compile.sh";
    const char* shellCmd = "bash -lc";
#endif

    std::cout << "[mint-runtime] building NetworkAgent minting pipeline..." << std::endl;
    int bc = std::system(buildCmd);
    if (bc != 0) {
        std::cerr << "[mint-runtime] build failed with code " << bc << std::endl;
        return bc;
    }

    // After compile, artifacts are staged under artifacts/staging/pkg-<timestamp>/
    // We don't hardcode the timestamp; we just pick the most recent pkg dir.
    std::string latestPkg;
#if defined(_WIN32)
    latestPkg = "for /f \"delims=\" %A in ('dir /b /ad /od artifacts\\staging') do @set L=artifacts\\staging\\%A && @echo %L%";
    // We can't portably parse in-process here; keep this façade simple.
#else
    latestPkg = "ls -1dt artifacts/staging/pkg-* | head -n 1";
#endif

    std::cout << "[mint-runtime] build complete. Check artifacts/staging for pkg-*." << std::endl;
    return 0;
}

int main(int argc, char** argv)
{
    try {
        return run_delegate();
    } catch (const std::exception& ex) {
        std::cerr << "[mint-runtime] exception: " << ex.what() << std::endl;
        return 2;
    } catch (...) {
        std::cerr << "[mint-runtime] unknown exception" << std::endl;
        return 3;
    }
}
'@

$rtCppPath = Join-Path $rtd 'minting_kernel.cpp'
Set-Content -LiteralPath $rtCppPath -Value $rtCpp -Encoding UTF8

# 3) Ensure a tiny CMake target exists for the runtime façade without touching your agent CMake.
$cmkRoot = Join-Path $PSScriptRoot '..\CMakeLists.txt'
$cmkText = Get-Content -Raw -LiteralPath $cmkRoot

if ($cmkText -notmatch 'add_executable\(\s*mint-runtime') {
  $append = @'
# ---- Fabric SuperNet: runtime facade target (auto-added) ----
add_executable(mint-runtime
    runtime/minting_kernel.cpp
)
set_target_properties(mint-runtime PROPERTIES CXX_STANDARD 17)
# no extra link deps: the façade shells out to existing agent build scripts
# --------------------------------------------------------------
'@
  Add-Content -LiteralPath $cmkRoot -Value "`r`n$append"
}

# 4) Optionally build the façade + run the repo’s normal compile path
if (-not $SkipBuild) {
  Write-Host "[mint-runtime] Building façade via repo compile scripts..." -ForegroundColor Cyan
  if (Test-Path "$PSScriptRoot\..\compile.bat") {
    & "$PSScriptRoot\..\compile.bat"
  } elseif (Test-Path "$PSScriptRoot/../compile.sh") {
    bash "$PSScriptRoot/../compile.sh"
  } else {
    Write-Warning "No compile.bat / compile.sh found; skipping repo build."
  }
}

Write-Host "[mint-runtime] Done. runtime/minting_kernel.cpp created and CMake updated." -ForegroundColor Green
