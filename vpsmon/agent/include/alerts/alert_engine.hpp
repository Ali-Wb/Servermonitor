#pragma once

#include "alerts/channels/channel.hpp"
#include "config/config.hpp"
#include "storage/metrics_store.hpp"

#include <map>
#include <mutex>
#include <string>
#include <vector>

class AlertEngine {
public:
    AlertEngine(const AgentConfig& config, MetricsStore& store);

    void evaluate();
    std::vector<std::string> triggerTest();
    void triggerConfigChangeAlert(const std::string& filename);
    void updateConfig(const AgentConfig& config);

private:
    AgentConfig config_;
    MetricsStore& store_;
    std::map<std::string, int64_t> cooldowns_;
    std::mutex mutex_;

    void trigger(const std::string& metric, const AlertMessage& message, bool ignoreCooldown, bool ignoreMaintenance);
    std::vector<std::string> enabledChannels() const;
};
