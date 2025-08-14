#include <iostream>
#include <string>
#include "../../runtime/treasury.h"
#include "../../runtime/policy.h"

int main() {
    std::string root = std::string(".."); // assumes running from agent build dir
    fabric::treasury_init(root);
    fabric::policy_init(root);
    if(!fabric::policy_check("LaptopAgent", "boot")) {
        std::cerr << "[policy] boot denied for LaptopAgent\n";
        return 1;
    }
    std::cout << "LaptopAgent boot OK" << std::endl;
    fabric::treasury_deposit("LaptopAgent", "boot", 0.01);
    return 0;
}
