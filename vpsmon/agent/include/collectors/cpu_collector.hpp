#pragma once

#include "collectors/snapshot.hpp"

#include <cstdint>
#include <vector>

class CpuCollector {
public:
    CpuCollector();
    CpuMetrics collect();

private:
    bool initialized_;
    uint64_t prevIdle_;
    uint64_t prevTotal_;
    std::vector<std::pair<uint64_t, uint64_t>> prevPerCore_;

    static double readTemperatureC();
};
