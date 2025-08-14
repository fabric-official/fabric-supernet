#!/usr/bin/env bash
set -euo pipefail
cmake -S . -B build -G Ninja -DCMAKE_C_COMPILER=clang -DCMAKE_CXX_COMPILER=clang++
cmake --build build --parallel
[ -f build/test_minting_kernel ] && ./build/test_minting_kernel || true
[ -f build/test_epoch_scheduler ] && ./build/test_epoch_scheduler || true
