#include "collectors/cpu_collector.hpp"

#include <fstream>
#include <sstream>
#include <string>

CpuCollector::CpuCollector()
    : initialized_(false),
      prevIdle_(0),
      prevTotal_(0) {
}

double CpuCollector::readTemperatureC() {
    std::ifstream tempFile("/sys/class/thermal/thermal_zone0/temp");
    if (!tempFile.is_open()) {
        return -1.0;
    }

    double milliC = 0.0;
    tempFile >> milliC;
    return milliC > 0.0 ? milliC / 1000.0 : -1.0;
}

CpuMetrics CpuCollector::collect() {
    CpuMetrics metrics;

    std::ifstream statFile("/proc/stat");
    if (!statFile.is_open()) {
        return metrics;
    }

    std::string line;
    std::vector<std::pair<uint64_t, uint64_t>> currentPerCore;

    while (std::getline(statFile, line)) {
        if (line.rfind("cpu", 0) != 0) {
            break;
        }

        std::stringstream ss(line);
        std::string label;
        uint64_t user = 0;
        uint64_t nice = 0;
        uint64_t system = 0;
        uint64_t idle = 0;
        uint64_t iowait = 0;
        uint64_t irq = 0;
        uint64_t softirq = 0;
        uint64_t steal = 0;

        ss >> label >> user >> nice >> system >> idle >> iowait >> irq >> softirq >> steal;
        const uint64_t idleAll = idle + iowait;
        const uint64_t nonIdle = user + nice + system + irq + softirq + steal;
        const uint64_t total = idleAll + nonIdle;

        if (label == "cpu") {
            if (!initialized_) {
                prevIdle_ = idleAll;
                prevTotal_ = total;
                metrics.usagePercent = 0.0;
            } else {
                const uint64_t totalDelta = total - prevTotal_;
                const uint64_t idleDelta = idleAll - prevIdle_;
                metrics.usagePercent = totalDelta == 0 ? 0.0
                    : 100.0 * static_cast<double>(totalDelta - idleDelta) / static_cast<double>(totalDelta);
                prevIdle_ = idleAll;
                prevTotal_ = total;
            }
        } else {
            currentPerCore.emplace_back(idleAll, total);
            const int coreId = static_cast<int>(metrics.cores.size());

            CpuCore core;
            core.id = coreId;
            core.label = label;
            core.temperatureCelsius = -1.0;

            if (!initialized_ || coreId >= static_cast<int>(prevPerCore_.size())) {
                core.usagePercent = 0.0;
            } else {
                const uint64_t prevCoreIdle = prevPerCore_[static_cast<std::size_t>(coreId)].first;
                const uint64_t prevCoreTotal = prevPerCore_[static_cast<std::size_t>(coreId)].second;
                const uint64_t totalDelta = total - prevCoreTotal;
                const uint64_t idleDelta = idleAll - prevCoreIdle;
                core.usagePercent = totalDelta == 0 ? 0.0
                    : 100.0 * static_cast<double>(totalDelta - idleDelta) / static_cast<double>(totalDelta);
            }

            metrics.cores.push_back(core);
        }
    }

    prevPerCore_ = currentPerCore;
    initialized_ = true;

    std::ifstream loadFile("/proc/loadavg");
    if (loadFile.is_open()) {
        loadFile >> metrics.loadAverage1m >> metrics.loadAverage5m >> metrics.loadAverage15m;
    }

    metrics.temperatureCelsius = readTemperatureC();
    return metrics;
}
