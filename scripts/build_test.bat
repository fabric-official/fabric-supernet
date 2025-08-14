@echo off
setlocal enabledelayedexpansion
set ROOT=%~dp0..
echo [build_test] ROOT=%ROOT%

if exist "%ROOT%\compile.bat" (
  echo [build_test] Running compile.bat
  call "%ROOT%\compile.bat"
) else (
  echo [build_test] No compile.bat found; attempting MSVC fallback (CMake)
  if not exist "%ROOT%\build" mkdir "%ROOT%\build"
  pushd "%ROOT%\build"
  cmake ..
  cmake --build . --config Release -- /m
  popd
)

echo [build_test] Static verification...
python "%ROOT%\tools\static_verify.py"
if exist "%ROOT%\logs" (
  echo [build_test] Runtime logs found; running runtime verifier
  python "%ROOT%\tools\verify_supernet.py"
) else (
  echo [build_test] No runtime logs; skip runtime verifier
)
echo [build_test] DONE
endlocal
