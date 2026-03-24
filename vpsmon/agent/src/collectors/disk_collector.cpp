#include "collectors/disk_collector.hpp"

#include <algorithm>
#include <chrono>
#include <cmath>
#include <fstream>
#include <sstream>
#include <string>
#include <sys/statvfs.h>
#include <unordered_set>

namespace {

int64_t nowMs() {
    return std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::system_clock::now().time_since_epoch()).count();
}

bool isPseudoFilesystem(const std::string& fsType) {
    static const std::unordered_set<std::string> pseudo = {
        "proc", "sysfs", "tmpfs", "devtmpfs", "devpts", "overlay", "squashfs", "cgroup", "cgroup2"
    };
    return pseudo.find(fsType) != pseudo.end();
}

double linearRegressionSlope(const std::vector<std::pair<int64_t, double>>& points) {
    if (points.size() < 2) {
        return 0.0;
    }

    long double sx = 0.0;
    long double sy = 0.0;
    long double sxx = 0.0;
    long double sxy = 0.0;
    const long double n = static_cast<long double>(points.size());

    for (const auto& point : points) {
        const long double x = static_cast<long double>(point.first);
        const long double y = static_cast<long double>(point.second);
        sx += x;
        sy += y;
        sxx += x * x;
        sxy += x * y;
    }

    const long double denom = (n * sxx) - (sx * sx);
    if (std::abs(denom) < 1e-9L) {
        return 0.0;
    }

    return static_cast<double>(((n * sxy) - (sx * sy)) / denom);
}

}  // namespace

DiskCollector::DiskCollector(MetricsStore& store, bool predictionEnabled, int predictionHistoryHours)
    : store_(store),
      predictionEnabled_(predictionEnabled),
      predictionHistoryHours_(predictionHistoryHours),
      lastPredictionUpdateMs_(0) {
}

std::vector<DiskMount> DiskCollector::collect() {
    std::unordered_map<std::string, DiskStats> currentStats;
    std::ifstream diskstats("/proc/diskstats");
    std::string line;

    while (std::getline(diskstats, line)) {
        std::stringstream ss(line);
        int major = 0;
        int minor = 0;
        std::string name;
        uint64_t readsCompleted = 0;
        uint64_t readsMerged = 0;
        uint64_t sectorsRead = 0;
        uint64_t readTicks = 0;
        uint64_t writesCompleted = 0;
        uint64_t writesMerged = 0;
        uint64_t sectorsWritten = 0;
        uint64_t writeTicks = 0;

        ss >> major >> minor >> name >> readsCompleted >> readsMerged >> sectorsRead >> readTicks
           >> writesCompleted >> writesMerged >> sectorsWritten >> writeTicks;

        currentStats[name] = {sectorsRead, readTicks, sectorsWritten, writeTicks};
    }

    std::vector<DiskMount> mounts;
    std::ifstream mountsFile("/proc/mounts");
    while (std::getline(mountsFile, line)) {
        std::stringstream ss(line);
        std::string device;
        std::string mountpoint;
        std::string fsType;
        std::string options;

        ss >> device >> mountpoint >> fsType >> options;
        if (device.empty() || mountpoint.empty() || isPseudoFilesystem(fsType)) {
            continue;
        }

        struct statvfs statbuf;
        if (statvfs(mountpoint.c_str(), &statbuf) != 0) {
            continue;
        }

        const int64_t total = static_cast<int64_t>(statbuf.f_blocks) * static_cast<int64_t>(statbuf.f_frsize);
        const int64_t free = static_cast<int64_t>(statbuf.f_bavail) * static_cast<int64_t>(statbuf.f_frsize);
        const int64_t used = total - free;

        DiskMount mount;
        mount.mountpoint = mountpoint;
        mount.filesystem = fsType;
        mount.totalBytes = total;
        mount.freeBytes = free;
        mount.usedBytes = used;
        mount.usagePercent = total > 0 ? (100.0 * static_cast<double>(used) / static_cast<double>(total)) : 0.0;

        const std::string baseName = device.substr(device.find_last_of('/') + 1);
        const auto nowIt = currentStats.find(baseName);
        const auto prevIt = prevStats_.find(baseName);
        if (nowIt != currentStats.end() && prevIt != prevStats_.end()) {
            const DiskStats& nowStats = nowIt->second;
            const DiskStats& prevStats = prevIt->second;

            const uint64_t deltaReadSectors = nowStats.sectorsRead - prevStats.sectorsRead;
            const uint64_t deltaWriteSectors = nowStats.sectorsWritten - prevStats.sectorsWritten;
            const uint64_t deltaReadTicks = nowStats.readTicks - prevStats.readTicks;
            const uint64_t deltaWriteTicks = nowStats.writeTicks - prevStats.writeTicks;

            mount.readBytesPerSecond = static_cast<double>(deltaReadSectors) * 512.0;
            mount.writeBytesPerSecond = static_cast<double>(deltaWriteSectors) * 512.0;

            const uint64_t deltaSectors = deltaReadSectors + deltaWriteSectors;
            const uint64_t deltaTicks = deltaReadTicks + deltaWriteTicks;
            mount.ioLatencyMs = deltaSectors == 0 ? -1.0
                : static_cast<double>(deltaTicks) / static_cast<double>(deltaSectors);
        } else {
            mount.readBytesPerSecond = 0.0;
            mount.writeBytesPerSecond = 0.0;
            mount.ioLatencyMs = -1.0;
        }

        mount.daysUntilFull = -1.0;
        mount.predictedUsage7d = -1.0;

        store_.writeMetric("disk " + mount.mountpoint + " usage", mount.usagePercent);
        mounts.push_back(mount);
    }

    prevStats_ = currentStats;

    if (predictionEnabled_) {
        updatePredictions(mounts);
    }

    return mounts;
}

void DiskCollector::updatePredictions(std::vector<DiskMount>& mounts) {
    const int64_t now = nowMs();
    constexpr int64_t kHourMs = 60LL * 60LL * 1000LL;
    if (lastPredictionUpdateMs_ != 0 && now - lastPredictionUpdateMs_ < kHourMs) {
        return;
    }

    lastPredictionUpdateMs_ = now;

    const int64_t fromTs = now - static_cast<int64_t>(predictionHistoryHours_) * kHourMs;
    for (DiskMount& mount : mounts) {
        const std::vector<std::pair<int64_t, double>> history =
            store_.queryHistory("disk " + mount.mountpoint + " usage", fromTs, 0);

        const double slopePerMs = linearRegressionSlope(history);
        const double slopePerHour = slopePerMs * static_cast<double>(kHourMs);

        mount.predictedUsage7d = std::clamp(mount.usagePercent + slopePerHour * 24.0 * 7.0, 0.0, 100.0);
        if (slopePerHour > 0.001) {
            mount.daysUntilFull = (100.0 - mount.usagePercent) / (slopePerHour * 24.0);
        } else {
            mount.daysUntilFull = -1.0;
        }
    }
}
