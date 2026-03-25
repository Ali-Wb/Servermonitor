#pragma once

#include <string>
#include <unordered_map>
#include <vector>

struct AgentConfig {
    // [storage]
    std::string db_path = "/var/lib/vpsmon/metrics.db";

    // [server]
    int port = 7070;
    std::string bind = "127.0.0.1";
    bool tls = false;
    std::string tls_cert = "/etc/vpsmon/cert.pem";
    std::string tls_key = "/etc/vpsmon/key.pem";
    int rate_limit_rps = 10;
    std::vector<std::string> allowed_ips;
    bool tui_auth_enabled = false;

    // [poll]
    int interval_ms = 1000;

    // [alerts]
    float cpu_threshold = 90.0f;
    float ram_threshold = 85.0f;
    float disk_threshold = 90.0f;
    float fd_threshold = 80.0f;
    float health_score_threshold = 50.0f;
    int alert_duration_s = 30;
    int startup_warmup_s = 5;

    // [anomaly]
    bool anomaly_enabled = true;
    float anomaly_threshold_sigma = 3.0f;
    int anomaly_min_datapoints = 14;

    // [channels]
    std::vector<std::string> channels_enabled;
    std::string slack_webhook_url;
    std::string discord_webhook_url;
    std::string telegram_bot_token;
    std::string telegram_chat_id;
    std::string smtp_host;
    int smtp_port = 587;
    std::string smtp_user;
    std::string smtp_pass;
    std::string smtp_from;
    std::string pagerduty_integration_key;
    std::string webhook_url;

    // [services]
    std::vector<std::string> services;

    // [dns]
    bool dns_enabled = false;
    std::vector<std::string> dns_check_hosts;

    // [docker]
    bool docker_enabled = true;

    // [gpu]
    std::string gpu_backend = "auto";

    // [healthchecks]
    std::unordered_map<std::string, std::string> healthchecks;

    // [maintenance]
    std::string maintenance_check_url;

    // [config_watch]
    std::vector<std::string> config_watch_files;
    bool config_watch_enabled = false;

    // [uptime]
    bool uptime_enabled = true;
    int uptime_heartbeat_interval_s = 60;

    // [recurring_reports]
    bool recurring_reports_enabled = false;
    std::string recurring_reports_schedule;
    std::string recurring_reports_recipients;
    int recurring_reports_period_days = 7;
};

class Config {
public:
    static AgentConfig load(const std::string& path);
    static AgentConfig loadOrDefault(const std::string& path);
};
