#include "policy.h"
#include <cstdlib>
#include <iostream>
namespace fabric {
  bool policy_check(const std::string& agent, const std::string& action) {
    const char* mode = std::getenv("FAB_POLICY_MODE"); // "stub" (default) or "grpc"
    if(!mode || std::string(mode)=="stub") {
      std::cout << "[policy/stub] agent="<<agent<<" action="<<action<<"\n";
      return true;
    }
    std::cout << "[policy/grpc] (not linked) agent="<<agent<<" action="<<action<<"\n";
    return false;
  }
}
