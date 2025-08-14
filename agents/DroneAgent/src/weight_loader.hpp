// SPDX-License-Identifier: Apache-2.0
#pragma once
#include <string>
#include <vector>
#include <cstddef>
struct WeightMeta{ std::string path; std::string algo; std::string digest; std::size_t min_bytes; std::size_t max_bytes; };
struct LoadedWeights{ std::string path; std::vector<unsigned char> bytes; };
LoadedWeights load_weights_or_rollback(const WeightMeta& meta, const std::string& rollback_path, std::string& err);
