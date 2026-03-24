#include "collectors/ram_collector.hpp"

#include <fstream>
#include <sstream>
#include <string>

RamMetrics RamCollector::collect() const {
    RamMetrics metrics;

    int64_t memTotalKb = 0;
    int64_t memFreeKb = 0;
    int64_t cachedKb = 0;
    int64_t buffersKb = 0;
    int64_t swapTotalKb = 0;
    int64_t swapFreeKb = 0;

    std::ifstream file("/proc/meminfo");
    std::string line;
    while (std::getline(file, line)) {
        std::stringstream ss(line);
        std::string key;
        int64_t value = 0;
        std::string unit;
        ss >> key >> value >> unit;

        if (key == "MemTotal:") memTotalKb = value;
        else if (key == "MemFree:") memFreeKb = value;
        else if (key == "Cached:") cachedKb = value;
        else if (key == "Buffers:") buffersKb = value;
        else if (key == "SwapTotal:") swapTotalKb = value;
        else if (key == "SwapFree:") swapFreeKb = value;
    }

    metrics.totalBytes = memTotalKb * 1024;
    metrics.freeBytes = memFreeKb * 1024;
    metrics.cachedBytes = cachedKb * 1024;
    metrics.bufferedBytes = buffersKb * 1024;
    metrics.usedBytes = metrics.totalBytes - metrics.freeBytes;
    metrics.swapTotalBytes = swapTotalKb * 1024;
    metrics.swapUsedBytes = (swapTotalKb - swapFreeKb) * 1024;

    metrics.usagePercent = metrics.totalBytes > 0
        ? (100.0 * static_cast<double>(metrics.usedBytes) / static_cast<double>(metrics.totalBytes))
        : 0.0;

    return metrics;
}
