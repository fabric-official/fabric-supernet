// SPDX-License-Identifier: Apache-2.0
#pragma once
#include <cstdint>
#include <array>
#include <vector>
#include <string>
struct SHA256 {
    std::array<uint32_t,8> state;
    uint64_t bitlen; size_t datalen; std::array<unsigned char,64> data;
    SHA256();
    void update(const unsigned char* d, size_t len);
    std::array<unsigned char,32> digest();
};
std::string hex_of(const unsigned char* p, size_t n);
std::array<unsigned char,32> hmac_sha256(const std::vector<unsigned char>& key, const std::vector<unsigned char>& msg);
