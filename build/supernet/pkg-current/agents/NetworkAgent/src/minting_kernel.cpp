#include <stdexcept>
struct MintInputs{ double load; unsigned long long current_params; unsigned long long cap_params; double epoch_budget; };
struct MintDecision{ unsigned long long target_params; double budget_spent; };
MintDecision minting_kernel(const MintInputs& in){
  if(in.load<0.0||in.load>1.0) throw std::invalid_argument("load");
  long double gap = (long double)in.cap_params - (long double)in.current_params; if(gap<0) gap=0;
  long double growth = gap*(in.load*in.load);
  unsigned long long target = in.current_params + (unsigned long long)growth;
  if(target>in.cap_params) target=in.cap_params;
  double needed = ((double)(target - in.current_params))/1.0e11;
  if(needed>in.epoch_budget){ double r=in.epoch_budget/needed; unsigned long long inc=(unsigned long long)((target-in.current_params)*r); target=in.current_params+inc; needed=in.epoch_budget; }
  return MintDecision{target, needed};
}
