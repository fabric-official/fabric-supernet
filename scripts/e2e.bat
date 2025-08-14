
@echo off
setlocal enabledelayedexpansion
cd /d %~dp0..

for %%A in (FabricGovernor AtomicMemoryDBAgent WiFiAgent NetworkAgent DroneAgent SmartphoneAgent LaptopAgent) do (
  echo == Build %%A ==
  cmake -S agents\%%A -B agents\%%A\build
  cmake --build agents\%%A\build -j
)

for %%A in (FabricGovernor AtomicMemoryDBAgent WiFiAgent NetworkAgent DroneAgent SmartphoneAgent LaptopAgent) do (
  echo == Train %%A ==
  python training\%%A\train.py
)

agents\FabricGovernor\build\FabricGovernor.exe

echo E2E OK
