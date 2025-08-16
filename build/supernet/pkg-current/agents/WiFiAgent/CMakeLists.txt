cmake_minimum_required(VERSION 3.16)
project(WiFiAgent LANGUAGES C CXX)
add_library(WiFiAgent STATIC
    src/sha256.cpp
    src/weight_loader.cpp
    src/treasury.cpp
    src/packet_router.cpp
    src/swarm_balancer.cpp
)
target_include_directories(WiFiAgent PUBLIC src)

add_library(runtime_stubs STATIC ../../runtime/treasury_stub.cpp ../../runtime/policy_stub.cpp)
target_include_directories(runtime_stubs PUBLIC ../../runtime)
target_link_libraries(WiFiAgent PRIVATE runtime_stubs)

add_subdirectory(../../runtime ../../runtime/build-WiFiAgent)
target_link_libraries(WiFiAgent PRIVATE FabricRuntime)
target_include_directories(WiFiAgent PRIVATE ../../runtime)
