#pragma once

#include "collectors/snapshot.hpp"
#include "storage/metrics_store.hpp"

#include <cstdint>
#include <string>
#include <unordered_map>
#include <vector>

class DiskCollector {
public:
    DiskCollector(MetricsStore& store, bool predictionEnabled, int predictionHistoryHours);

    std::vector<DiskMount> collect();

private:
    struct DiskStats {
        uint64_t sectorsRead = 0;
        uint64_t readTicks = 0;
        uint64_t sectorsWritten = 0;
        uint64_t writeTicks = 0;
    };

    MetricsStore& store_;
    bool predictionEnabled_;
    int predictionHistoryHours_;
    int64_t lastPredictionUpdateMs_;
    std::unordered_map<std::string, DiskStats> prevStats_;

    void updatePredictions(std::vector<DiskMount>& mounts);
};
