#include <iostream>
#include <string>
#include "../../runtime/treasury.h"
#include "../../runtime/policy.h"

int main() {
    std::string root = std::string(".."); // assumes running from agent build dir
    fabric::treasury_init(root);
    fabric::policy_init(root);
    if(!fabric::policy_check("AtomicMemoryDBAgent", "boot")) {
        std::cerr << "[policy] boot denied for AtomicMemoryDBAgent\n";
        return 1;
    }
    std::cout << "AtomicMemoryDBAgent boot OK" << std::endl;
    fabric::treasury_deposit("AtomicMemoryDBAgent", "boot", 0.01);
    return 0;
}
