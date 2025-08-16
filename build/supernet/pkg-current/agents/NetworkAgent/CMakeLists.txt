cmake_minimum_required(VERSION 3.16)
project(NetworkAgent LANGUAGES C CXX)
add_library(NetworkAgent STATIC
    src/sha256.cpp
    src/weight_loader.cpp
    src/treasury.cpp
    src/handshake.cpp
    src/minting_manager.cpp
    src/minting_kernel.cpp
    src/mint_delta.cpp
)
target_include_directories(NetworkAgent PUBLIC src)

add_library(runtime_stubs STATIC ../../runtime/treasury_stub.cpp ../../runtime/policy_stub.cpp)
target_include_directories(runtime_stubs PUBLIC ../../runtime)
target_link_libraries(NetworkAgent PRIVATE runtime_stubs)

add_subdirectory(../../runtime ../../runtime/build-NetworkAgent)
target_link_libraries(NetworkAgent PRIVATE FabricRuntime)
target_include_directories(NetworkAgent PRIVATE ../../runtime)
