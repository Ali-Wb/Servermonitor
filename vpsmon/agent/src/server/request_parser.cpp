#include "server/request_parser.hpp"

#include <regex>
#include <stdexcept>

namespace {

std::string parseStringField(const std::string& json, const std::string& field) {
    const std::regex re("\"" + field + "\"\\s*:\\s*\"([^\"]*)\"");
    std::smatch match;
    if (std::regex_search(json, match, re) && match.size() > 1) {
        return match[1].str();
    }
    return "";
}

int parseIntField(const std::string& json, const std::string& field, int fallback) {
    const std::regex re("\"" + field + "\"\\s*:\\s*(-?[0-9]+)");
    std::smatch match;
    if (std::regex_search(json, match, re) && match.size() > 1) {
        return std::stoi(match[1].str());
    }
    return fallback;
}

}  // namespace

AgentRequest parseRequest(const std::string& json) {
    if (json.empty() || json.front() != '{') {
        throw std::invalid_argument("bad JSON");
    }

    AgentRequest req;
    req.cmd = parseStringField(json, "cmd");
    if (req.cmd.empty()) {
        throw std::invalid_argument("missing cmd");
    }

    req.metric = parseStringField(json, "metric");
    req.duration = parseStringField(json, "duration");
    req.maxPoints = parseIntField(json, "maxPoints", 0);
    req.period = parseStringField(json, "period");
    req.alert_id = parseIntField(json, "alert_id", 0);
    req.lines = parseIntField(json, "lines", 100);
    req.key = parseStringField(json, "key");
    req.acknowledged_by = parseStringField(json, "acknowledged_by");
    if (req.acknowledged_by.empty()) {
        req.acknowledged_by = "tui";
    }

    return req;
}
