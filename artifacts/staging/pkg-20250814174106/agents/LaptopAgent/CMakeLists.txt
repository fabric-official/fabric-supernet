cmake_minimum_required(VERSION 3.16)
project(LaptopAgent LANGUAGES C CXX)
add_library(LaptopAgent STATIC
    src/sha256.cpp
    src/weight_loader.cpp
    src/treasury.cpp
    src/os_hook_init.cpp
    src/browser_watch.cpp
    src/exec_multiplex.cpp
    src/energy_meter.cpp
)
target_include_directories(LaptopAgent PUBLIC src)

add_library(runtime_stubs STATIC ../../runtime/treasury_stub.cpp ../../runtime/policy_stub.cpp)
target_include_directories(runtime_stubs PUBLIC ../../runtime)
target_link_libraries(LaptopAgent PRIVATE runtime_stubs)

add_subdirectory(../../runtime ../../runtime/build-LaptopAgent)
target_link_libraries(LaptopAgent PRIVATE FabricRuntime)
target_include_directories(LaptopAgent PRIVATE ../../runtime)
