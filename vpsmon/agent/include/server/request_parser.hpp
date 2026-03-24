#pragma once

#include <string>

struct AgentRequest {
    std::string cmd;
    std::string metric;
    std::string duration;
    int maxPoints = 0;
    std::string period;
    int alert_id = 0;
    int lines = 100;
    std::string key;
    std::string acknowledged_by = "tui";
};

AgentRequest parseRequest(const std::string& json);
