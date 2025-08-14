cmake_minimum_required(VERSION 3.16)
project(FabricGovernor LANGUAGES C CXX)
add_library(FabricGovernor STATIC
    src/sha256.cpp
    src/weight_loader.cpp
    src/treasury.cpp
    src/governance_loop.cpp
    src/policy_kernel.cpp
    src/audit_trail.cpp
    src/consensus_router.cpp
    src/epoch_scheduler.cpp
)
target_include_directories(FabricGovernor PUBLIC src)

add_library(runtime_stubs STATIC ../../runtime/treasury_stub.cpp ../../runtime/policy_stub.cpp)
target_include_directories(runtime_stubs PUBLIC ../../runtime)
target_link_libraries(FabricGovernor PRIVATE runtime_stubs)

add_subdirectory(../../runtime ../../runtime/build-FabricGovernor)
target_link_libraries(FabricGovernor PRIVATE FabricRuntime)
target_include_directories(FabricGovernor PRIVATE ../../runtime)
