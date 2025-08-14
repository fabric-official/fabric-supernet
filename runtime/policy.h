
#pragma once
#include <string>

namespace fabric {
  // Returns true if action is allowed for the agent
  bool policy_init(const std::string& root);
  bool policy_check(const std::string& agent, const std::string& action);
}
