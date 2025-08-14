#include <atomic>
struct MintInputs; struct MintDecision; extern MintDecision minting_kernel(const MintInputs&);
static std::atomic<unsigned long long> g_params{0};
static const unsigned long long kMax=158500000000ULL;
extern "C" unsigned long long mint_current(){ return g_params.load(); }
extern "C" unsigned long long mint_request(double load, double epoch_budget){
  MintInputs in{load, g_params.load(), kMax, epoch_budget};
  auto d = minting_kernel(in);
  if(d.target_params>kMax) d.target_params=kMax;
  g_params.store(d.target_params);
  return g_params.load();
}
extern "C" unsigned long long mint_collapse(unsigned long long to){
  if(to>kMax) to=kMax; g_params.store(to); return to;
}
