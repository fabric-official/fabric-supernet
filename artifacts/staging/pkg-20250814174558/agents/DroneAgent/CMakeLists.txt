cmake_minimum_required(VERSION 3.16)
project(DroneAgent LANGUAGES C CXX)
add_library(DroneAgent STATIC
    src/sha256.cpp
    src/weight_loader.cpp
    src/treasury.cpp
    src/uplink.cpp
    src/signal_extender.cpp
    src/drone_id_beacon.cpp
    src/audit_delta.cpp
)
target_include_directories(DroneAgent PUBLIC src)

add_library(runtime_stubs STATIC ../../runtime/treasury_stub.cpp ../../runtime/policy_stub.cpp)
target_include_directories(runtime_stubs PUBLIC ../../runtime)
target_link_libraries(DroneAgent PRIVATE runtime_stubs)

add_subdirectory(../../runtime ../../runtime/build-DroneAgent)
target_link_libraries(DroneAgent PRIVATE FabricRuntime)
target_include_directories(DroneAgent PRIVATE ../../runtime)
