// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2025

#pragma once
#include <cstdint>
#include <vector>
#include <string>

struct MintDeltaRecord{
    uint64_t epoch;
    uint64_t new_params;
    std::string agent; // "NetworkAgent"
    std::vector<unsigned char> hmac; // 32 bytes
};

std::vector<unsigned char> serialize_mint_delta(const MintDeltaRecord& r);
