#pragma once

#include "config/config.hpp"

#include <string>
#include <vector>

struct CheckResult {
    enum class Status {
        PASS,
        WARN,
        FAIL,
    };

    std::string name;
    Status status;
    std::string message;
};

class ConfigValidator {
public:
    static std::vector<CheckResult> validate(const AgentConfig& config, bool updateRequested = false);
    static int printResults(const std::vector<CheckResult>& results);
};
