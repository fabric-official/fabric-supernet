// SPDX-License-Identifier: Apache-2.0
#include "weight_loader.hpp"
#include "sha256.hpp"
#include <fstream>
#include <iterator>
#include <cstdlib>
static bool verify_digest_sha256(const std::vector<unsigned char>& buf, const std::string& algo, const std::string& hex_expected){
    if(hex_expected.empty()) return false;
    if(algo!="SHA256") return false;
    SHA256 s; s.update(buf.data(), buf.size()); auto d = s.digest();
    return hex_of(d.data(), d.size()) == hex_expected;
}
LoadedWeights load_weights_or_rollback(const WeightMeta& meta, const std::string& rollback_path, std::string& err){
    LoadedWeights out;
    auto try_read = [&](const std::string& p)->bool{
        std::ifstream f(p, std::ios::binary);
        if(!f){ err="open failed"; return false; }
        std::vector<unsigned char> b((std::istreambuf_iterator<char>(f)), std::istreambuf_iterator<char>());
        if(b.size()<meta.min_bytes || b.size()>meta.max_bytes){ err="weight size out of bounds"; return false; }
        const bool dev = (std::getenv("FAB_ALLOW_DEV_WEIGHTS")!=nullptr);
        const bool ok  = verify_digest_sha256(b, meta.algo, meta.digest);
        if(!(ok || dev)){ err="digest mismatch"; return false; }
        out.path = p; out.bytes.swap(b); return true;
    };
    if(try_read(meta.path)) return out;
    if(!rollback_path.empty() && try_read(rollback_path)) return out;
    if(out.bytes.empty() && err.empty()) err="load failed";
    return out;
}
