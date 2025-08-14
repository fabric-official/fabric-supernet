#include "treasury.h"
#include <cstdlib>
#include <iostream>
namespace fabric {
  bool treasury_deposit(const std::string& agent, const std::string& event, double amount) {
    const char* mode = std::getenv("FAB_TREASURY_MODE"); // "stub" (default) or "grpc"
    if(!mode || std::string(mode)=="stub") {
      std::cout << "[treasury/stub] agent="<<agent<<" event="<<event<<" amount="<<amount<<"\n";
      return true;
    }
    // grpc mode would connect to FAB_TREASURY_GRPC; left unimplemented here
    std::cout << "[treasury/grpc] (not linked) agent="<<agent<<" event="<<event<<" amount="<<amount<<"\n";
    return false;
  }
}
