#include <thread>
void epoch_open_if_needed();
namespace treasury{ void require_budget_or_throw(); }
using namespace std::chrono_literals;
int governance_main(){ while(true){ treasury::require_budget_or_throw(); epoch_open_if_needed(); std::this_thread::sleep_for(3ms);} }
