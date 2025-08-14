// SPDX-License-Identifier: Apache-2.0
#include <cassert>
void set_epoch_duration_ms(unsigned long long);
void epoch_open_if_needed();
unsigned long long current_epoch();
int main(){ set_epoch_duration_ms(1); for(int i=0;i<5;i++) epoch_open_if_needed(); return 0; }
