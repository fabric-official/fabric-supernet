#include <iostream>
#include <string>
#include "../../runtime/treasury.h"
#include "../../runtime/policy.h"

int main() {
    std::string root = std::string(".."); // assumes running from agent build dir
    fabric::treasury_init(root);
    fabric::policy_init(root);
    if(!fabric::policy_check("FabricGovernor", "boot")) {
        std::cerr << "[policy] boot denied for FabricGovernor\n";
        return 1;
    }
    std::cout << "FabricGovernor boot OK" << std::endl;
    fabric::treasury_deposit("FabricGovernor", "boot", 0.01);
    return 0;
}
