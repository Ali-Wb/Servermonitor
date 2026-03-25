#include "alerts/alert_engine.hpp"

#include "util/logger.hpp"

#include <algorithm>
#include <chrono>
#include <thread>

namespace {
int64_t nowMs() {
    return std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::system_clock::now().time_since_epoch()).count();
}
}

AlertEngine::AlertEngine(const AgentConfig& config, MetricsStore& store)
    : config_(config),
      store_(store),
      cooldowns_(store_.loadCooldowns()) {
}

std::vector<std::string> AlertEngine::enabledChannels() const {
    return config_.channels_enabled;
}

void AlertEngine::trigger(const std::string& metric, const AlertMessage& message, bool ignoreCooldown, bool /*ignoreMaintenance*/) {
    const int64_t now = nowMs();
    {
        std::lock_guard<std::mutex> lock(mutex_);
        const auto it = cooldowns_.find(metric);
        if (!ignoreCooldown && it != cooldowns_.end() && (now - it->second) < 60000) {
            return;
        }
        cooldowns_[metric] = now;
        store_.saveCooldown(metric, now);
    }

    const auto channels = enabledChannels();
    for (const std::string& channel : channels) {
        std::thread([this, channel, message]() {
            bool ok = false;
            if (channel == "slack") ok = sendSlack(config_, message);
            else if (channel == "discord") ok = sendDiscord(config_, message);
            else if (channel == "telegram") ok = sendTelegram(config_, message);
            else if (channel == "smtp") ok = sendSmtp(config_, message);
            else if (channel == "pagerduty") ok = sendPagerDuty(config_, message);
            else if (channel == "webhook") ok = sendWebhook(config_, message);
            if (!ok) LOG_WARN("alert channel dispatch failed: " + channel);
        }).detach();
    }
}

void AlertEngine::evaluate() {
    AlertMessage message;
    message.title = "Health score warning";
    message.subject = "Health score warning";
    message.body = "health score threshold exceeded";
    message.severity = "warning";
    trigger("health_score", message, false, false);
}

std::vector<std::string> AlertEngine::triggerTest() {
    AlertMessage message;
    message.title = "Test alert";
    message.subject = "Test alert";
    message.body = "manual test";
    message.severity = "info";
    trigger("test_alert", message, true, true);
    return enabledChannels();
}

void AlertEngine::triggerConfigChangeAlert(const std::string& filename) {
    AlertMessage message;
    message.title = "Config changed";
    message.subject = "Config changed";
    message.body = "file changed: " + filename;
    message.severity = "warning";
    trigger("config_change", message, true, true);
}

void AlertEngine::updateConfig(const AgentConfig& config) {
    std::lock_guard<std::mutex> lock(mutex_);
    config_ = config;
}
