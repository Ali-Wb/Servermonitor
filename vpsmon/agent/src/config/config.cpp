#include "config/config.hpp"

#include <algorithm>
#include <cctype>
#include <fstream>
#include <sstream>
#include <stdexcept>

namespace {

std::string trim(const std::string& value) {
    std::size_t start = 0;
    while (start < value.size() && std::isspace(static_cast<unsigned char>(value[start])) != 0) {
        ++start;
    }

    std::size_t end = value.size();
    while (end > start && std::isspace(static_cast<unsigned char>(value[end - 1])) != 0) {
        --end;
    }

    return value.substr(start, end - start);
}

std::vector<std::string> splitCsv(const std::string& value) {
    std::vector<std::string> parts;
    std::stringstream stream(value);
    std::string token;

    while (std::getline(stream, token, ',')) {
        std::string cleaned = trim(token);
        if (!cleaned.empty()) {
            parts.push_back(cleaned);
        }
    }

    return parts;
}

bool parseBool(const std::string& value) {
    std::string lowered = value;
    std::transform(lowered.begin(), lowered.end(), lowered.begin(), [](unsigned char ch) {
        return static_cast<char>(std::tolower(ch));
    });

    return lowered == "1" || lowered == "true" || lowered == "yes" || lowered == "on";
}

void applyEntry(AgentConfig& cfg, const std::string& section, const std::string& key, const std::string& rawValue) {
    const std::string value = trim(rawValue);

    if (section == "server") {
        if (key == "port") cfg.port = std::stoi(value);
        else if (key == "bind") cfg.bind = value;
        else if (key == "tls") cfg.tls = parseBool(value);
        else if (key == "tls_cert") cfg.tls_cert = value;
        else if (key == "tls_key") cfg.tls_key = value;
        else if (key == "rate_limit_rps") cfg.rate_limit_rps = std::stoi(value);
        else if (key == "allowed_ips") cfg.allowed_ips = splitCsv(value);
        else if (key == "tui_auth_enabled") cfg.tui_auth_enabled = parseBool(value);
    } else if (section == "poll") {
        if (key == "interval_ms") cfg.interval_ms = std::stoi(value);
    } else if (section == "alerts") {
        if (key == "cpu_threshold") cfg.cpu_threshold = std::stof(value);
        else if (key == "ram_threshold") cfg.ram_threshold = std::stof(value);
        else if (key == "disk_threshold") cfg.disk_threshold = std::stof(value);
        else if (key == "fd_threshold") cfg.fd_threshold = std::stof(value);
        else if (key == "health_score_threshold") cfg.health_score_threshold = std::stof(value);
        else if (key == "alert_duration_s") cfg.alert_duration_s = std::stoi(value);
        else if (key == "startup_warmup_s") cfg.startup_warmup_s = std::stoi(value);
    } else if (section == "anomaly") {
        if (key == "enabled") cfg.anomaly_enabled = parseBool(value);
        else if (key == "threshold_sigma") cfg.anomaly_threshold_sigma = std::stof(value);
        else if (key == "min_datapoints") cfg.anomaly_min_datapoints = std::stoi(value);
    } else if (section == "channels") {
        if (key == "enabled") cfg.channels_enabled = splitCsv(value);
        else if (key == "slack_webhook_url") cfg.slack_webhook_url = value;
        else if (key == "discord_webhook_url") cfg.discord_webhook_url = value;
        else if (key == "telegram_bot_token") cfg.telegram_bot_token = value;
        else if (key == "telegram_chat_id") cfg.telegram_chat_id = value;
        else if (key == "smtp_host") cfg.smtp_host = value;
        else if (key == "smtp_port") cfg.smtp_port = std::stoi(value);
        else if (key == "smtp_user") cfg.smtp_user = value;
        else if (key == "smtp_pass") cfg.smtp_pass = value;
        else if (key == "smtp_from") cfg.smtp_from = value;
        else if (key == "pagerduty_integration_key") cfg.pagerduty_integration_key = value;
        else if (key == "webhook_url") cfg.webhook_url = value;
    } else if (section == "services") {
        if (key == "watch") cfg.services = splitCsv(value);
    } else if (section == "dns") {
        if (key == "check_hosts") cfg.dns_check_hosts = splitCsv(value);
    } else if (section == "healthchecks") {
        cfg.healthchecks[key] = value;  // split done on first '=' during parsing.
    } else if (section == "maintenance") {
        if (key == "check_url") cfg.maintenance_check_url = value;
    } else if (section == "config_watch") {
        if (key == "enabled") cfg.config_watch_enabled = parseBool(value);
        else if (key == "files") cfg.config_watch_files = splitCsv(value);
    } else if (section == "uptime") {
        if (key == "enabled") cfg.uptime_enabled = parseBool(value);
        else if (key == "heartbeat_interval_s") cfg.uptime_heartbeat_interval_s = std::stoi(value);
    } else if (section == "recurring_reports") {
        if (key == "enabled") cfg.recurring_reports_enabled = parseBool(value);
        else if (key == "schedule") cfg.recurring_reports_schedule = value;
        else if (key == "recipients") cfg.recurring_reports_recipients = value;
        else if (key == "period_days") cfg.recurring_reports_period_days = std::stoi(value);
    }
}

}  // namespace

AgentConfig Config::load(const std::string& path) {
    std::ifstream file(path);
    if (!file.is_open()) {
        throw std::runtime_error("unable to open config file: " + path);
    }

    AgentConfig config;
    std::string section;
    std::string line;

    while (std::getline(file, line)) {
        const std::string cleaned = trim(line);
        if (cleaned.empty() || cleaned[0] == '#' || cleaned[0] == ';') {
            continue;
        }

        if (cleaned.front() == '[' && cleaned.back() == ']') {
            section = trim(cleaned.substr(1, cleaned.size() - 2));
            continue;
        }

        const std::size_t eqPos = cleaned.find('=');
        if (eqPos == std::string::npos) {
            continue;
        }

        const std::string key = trim(cleaned.substr(0, eqPos));
        const std::string value = trim(cleaned.substr(eqPos + 1));
        if (!key.empty()) {
            applyEntry(config, section, key, value);
        }
    }

    return config;
}

AgentConfig Config::loadOrDefault(const std::string& path) {
    try {
        return load(path);
    } catch (...) {
        return AgentConfig{};
    }
}
