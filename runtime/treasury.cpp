
#include "treasury.h"
#include <fstream>
#include <ctime>
#include <filesystem>
#include <nlohmann/json.hpp>

static std::string g_root;

namespace fabric {

bool treasury_init(const std::string& root) {
  g_root = root;
  std::filesystem::create_directories(g_root + "/state");
  std::ofstream(g_root + "/state/treasury_ledger.json", std::ios::app);
  return true;
}

bool treasury_deposit(const std::string& agent, const std::string& event, double amount) {
  using json = nlohmann::json;
  std::uint64_t now = (std::uint64_t)std::time(nullptr);
  json j = {
    {"agent", agent},
    {"event", event},
    {"amount", amount},
    {"ts", now}
  };
  std::filesystem::create_directories(g_root + "/state");
  std::ofstream out(g_root + "/state/treasury_ledger.json", std::ios::app);
  if(!out.good()) return false;
  out << j.dump() << "\n";
  return true;
}

} // namespace fabric
