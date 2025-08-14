#include <iostream>
#include <string>
#include "../../runtime/treasury.h"
#include "../../runtime/policy.h"

int main() {
    std::string root = std::string(".."); // assumes running from agent build dir
    fabric::treasury_init(root);
    fabric::policy_init(root);
    if(!fabric::policy_check("SmartphoneAgent", "boot")) {
        std::cerr << "[policy] boot denied for SmartphoneAgent\n";
        return 1;
    }
    std::cout << "SmartphoneAgent boot OK" << std::endl;
    fabric::treasury_deposit("SmartphoneAgent", "boot", 0.01);
    return 0;
}
