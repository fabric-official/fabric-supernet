@echo off
setlocal enabledelayedexpansion
cd /d %~dp0..
for %%A in (FabricGovernor AtomicMemoryDBAgent WiFiAgent NetworkAgent DroneAgent SmartphoneAgent LaptopAgent) do (
  echo == Build %%A ==
  cmake -S agents\%%A -B agents\%%A\build
  cmake --build agents\%%A\build -j
)
set FAB_TREASURY_MODE=stub
set FAB_POLICY_MODE=stub
agents\FabricGovernor\build\FabricGovernor.exe
echo Smoke OK
