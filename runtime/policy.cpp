
#include "policy.h"
#include <fstream>
#include <sstream>
#include <string>
#include <unordered_set>
#include <filesystem>
#include <nlohmann/json.hpp>

static std::string g_root;

namespace fabric {

bool policy_init(const std::string& root) {
  g_root = root;
  std::filesystem::create_directories(g_root + "/state");
  return true;
}

// Simple policy format: agents/<Agent>/policy.rules = allowed actions, one per line
bool policy_check(const std::string& agent, const std::string& action) {
  std::string path = g_root + "/agents/" + agent + "/policy.rules";
  std::ifstream in(path);
  if(!in.good()) {
    // no rules file -> allow by default (can tighten if desired)
    return true;
  }
  std::unordered_set<std::string> allowed;
  std::string line;
  while(std::getline(in, line)) {
    if(line.size() && line[0] != '#') allowed.insert(line);
  }
  return allowed.count(action) > 0;
}

} // namespace fabric
