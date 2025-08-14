
#pragma once
#include <string>
#include <sstream>
#include <map>
#include <variant>

namespace nlohmann {
  class json {
    std::map<std::string, std::string> kv;
  public:
    json(std::initializer_list<std::pair<const std::string, std::string>> init) {
      for (auto &p : init) kv[p.first] = p.second;
    }
    json(std::initializer_list<std::pair<const std::string, double>> init) {
      for (auto &p : init) kv[p.first] = std::to_string(p.second);
    }
    json(std::initializer_list<std::pair<const std::string, long long>> init) {
      for (auto &p : init) kv[p.first] = std::to_string(p.second);
    }
    std::string dump() const {
      std::ostringstream oss;
      oss << "{";
      bool first = true;
      for (auto &p : kv) {
        if(!first) oss << ",";
        first = false;
        oss << "\"" << p.first << "\":\"" << p.second << "\"";
      }
      oss << "}";
      return oss.str();
    }
  };
}
