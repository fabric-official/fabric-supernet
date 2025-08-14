
#pragma once
#include <string>
#include <cstdint>

namespace fabric {
  struct Deposit {
    std::string agent;
    std::string event;
    double amount;
    std::uint64_t ts;
  };
  bool treasury_init(const std::string& root);
  bool treasury_deposit(const std::string& agent, const std::string& event, double amount);
}
