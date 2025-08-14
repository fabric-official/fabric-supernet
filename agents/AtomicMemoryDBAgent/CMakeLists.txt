cmake_minimum_required(VERSION 3.16)
project(AtomicMemoryDBAgent LANGUAGES C CXX)
add_library(AtomicMemoryDBAgent STATIC
    src/sha256.cpp
    src/weight_loader.cpp
    src/treasury.cpp
    src/memory_persistor.cpp
    src/royalty_from_memory.cpp
    src/memory_exchange.cpp
)
target_include_directories(AtomicMemoryDBAgent PUBLIC src)

add_library(runtime_stubs STATIC ../../runtime/treasury_stub.cpp ../../runtime/policy_stub.cpp)
target_include_directories(runtime_stubs PUBLIC ../../runtime)
target_link_libraries(AtomicMemoryDBAgent PRIVATE runtime_stubs)

add_subdirectory(../../runtime ../../runtime/build-AtomicMemoryDBAgent)
target_link_libraries(AtomicMemoryDBAgent PRIVATE FabricRuntime)
target_include_directories(AtomicMemoryDBAgent PRIVATE ../../runtime)
