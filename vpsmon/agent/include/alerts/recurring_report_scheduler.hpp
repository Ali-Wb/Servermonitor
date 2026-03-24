#pragma once

#include "config/config.hpp"
#include "storage/metrics_store.hpp"

#include <cstdint>
#include <string>

class RecurringReportScheduler {
public:
    RecurringReportScheduler(const AgentConfig& config, MetricsStore& store);

    void tick();
    void updateConfig(const AgentConfig& config);

private:
    AgentConfig config_;
    MetricsStore& store_;
    int64_t lastRunMs_ = 0;
    int64_t lastTickCheckMs_ = 0;

    bool shouldRun(int64_t nowMs) const;
    std::string buildHtmlReport(int periodDays) const;
};
