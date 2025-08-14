#include <atomic>
#include <chrono>
static std::atomic<unsigned long long> g_epoch_id{0};
static std::atomic<unsigned long long> g_epoch_ms{60000};
void epoch_open_if_needed(){ static auto last=std::chrono::steady_clock::now(); auto now=std::chrono::steady_clock::now();
  auto ms=std::chrono::duration_cast<std::chrono::milliseconds>(now-last).count();
  if((unsigned long long)ms>=g_epoch_ms.load()){ g_epoch_id.fetch_add(1); last=now; } }
unsigned long long current_epoch(){ return g_epoch_id.load(); }
void set_epoch_duration_ms(unsigned long long ms){ g_epoch_ms.store(ms); }
