
cmake_minimum_required(VERSION 3.16)
project(FabricRuntime CXX)

set(CMAKE_CXX_STANDARD 17)
add_library(FabricRuntime STATIC treasury.cpp policy.cpp)
target_include_directories(FabricRuntime PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})

# vendored single-header JSON (nlohmann) to avoid external deps
# We'll generate it as json.hpp in this directory.
