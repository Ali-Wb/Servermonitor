#pragma once

#include "storage/sqlite.hpp"
#include "collectors/snapshot.hpp"

#include <cstdint>
#include <map>
#include <memory>
#include <string>
#include <utility>
#include <vector>

class MetricsStore {
public:
    explicit MetricsStore(std::string dbPath);

    bool init();
    bool checkAndRepairDatabase();

    void writeMetric(const std::string& metric, double value, int64_t timestampMs = 0);

    std::vector<std::pair<int64_t, double>> queryHistory(
        const std::string& metric,
        int64_t fromTs,
        int maxPoints = 0
    ) const;
    std::vector<AlertRow> queryAlerts(int limit = 100) const;
    bool resolveAlert(int alertId, int64_t resolvedAtMs);
    bool acknowledgeAlert(int alertId, const std::string& acknowledgedBy, int64_t acknowledgedAtMs = 0);
    UptimeStats queryUptime(const std::string& period) const;
    void updateAnomalyBaseline();
    int64_t loadSchedulerState(const std::string& name) const;
    void saveSchedulerState(const std::string& name, int64_t lastRunMs);

    // Cooldown persistence.
    void saveCooldown(const std::string& metric, int64_t lastFiredMs);
    std::map<std::string, int64_t> loadCooldowns() const;
    bool cooldownsPersisted() const { return true; }

    // Downsampling maintenance.
    void runDownsamplerOnce(const std::string& metric);

private:
    struct HistoryPoint {
        int64_t ts;
        double value;
    };

    std::string dbPath_;
    mutable std::unique_ptr<Database> db_;

    void createSchema();
    void ensureOpen() const;

    std::string pickTierTable(int64_t fromTs, int64_t nowMs) const;
    std::vector<std::pair<int64_t, double>> applyBucketDownsample(
        const std::vector<HistoryPoint>& input,
        int64_t fromTs,
        int64_t nowMs,
        int maxPoints
    ) const;

    void aggregateAndPrune(
        const std::string& sourceTable,
        const std::string& targetTable,
        const std::string& stateColumn,
        int64_t windowMs,
        const std::string& metric
    );
};
