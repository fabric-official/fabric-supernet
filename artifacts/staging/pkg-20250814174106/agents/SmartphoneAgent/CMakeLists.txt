cmake_minimum_required(VERSION 3.16)
project(SmartphoneAgent LANGUAGES C CXX)
add_library(SmartphoneAgent STATIC
    src/sha256.cpp
    src/weight_loader.cpp
    src/treasury.cpp
    src/init_device_brain.cpp
    src/bandwidth_client.cpp
)
target_include_directories(SmartphoneAgent PUBLIC src)

add_library(runtime_stubs STATIC ../../runtime/treasury_stub.cpp ../../runtime/policy_stub.cpp)
target_include_directories(runtime_stubs PUBLIC ../../runtime)
target_link_libraries(SmartphoneAgent PRIVATE runtime_stubs)

add_subdirectory(../../runtime ../../runtime/build-SmartphoneAgent)
target_link_libraries(SmartphoneAgent PRIVATE FabricRuntime)
target_include_directories(SmartphoneAgent PRIVATE ../../runtime)
