// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2025

#include <vector>
#include <string>
struct AuditEntry{ std::string delta; unsigned long long value; };
void audit_append(std::vector<AuditEntry>& log,const std::string& d,unsigned long long v){ log.push_back({d,v}); }
