#include "collectors/fd_collector.hpp"

#include <algorithm>
#include <cctype>
#include <dirent.h>
#include <fstream>
#include <string>
#include <vector>

FdMetrics FdCollector::collect() const {
    FdMetrics result;

    std::ifstream fileNr("/proc/sys/fs/file-nr");
    int64_t allocated = 0;
    int64_t unused = 0;
    int64_t max = 0;
    if (fileNr.is_open()) {
        fileNr >> allocated >> unused >> max;
    }

    result.open = static_cast<int>(allocated);
    result.limit = static_cast<int>(max);
    result.usagePercent = max > 0 ? (100.0 * static_cast<double>(allocated) / static_cast<double>(max)) : 0.0;

    std::vector<FdConsumer> consumers;
    DIR* proc = opendir("/proc");
    if (!proc) return result;

    dirent* entry = nullptr;
    while ((entry = readdir(proc)) != nullptr) {
        std::string pidStr = entry->d_name;
        if (pidStr.empty() || !std::all_of(pidStr.begin(), pidStr.end(), ::isdigit)) continue;

        const std::string fdPath = "/proc/" + pidStr + "/fd";
        DIR* fdDir = opendir(fdPath.c_str());
        if (!fdDir) continue;

        int count = 0;
        while (readdir(fdDir) != nullptr) ++count;
        closedir(fdDir);

        FdConsumer c;
        c.pid = std::stoi(pidStr);
        c.name = pidStr;
        c.openCount = std::max(0, count - 2);
        consumers.push_back(c);
    }
    closedir(proc);

    std::sort(consumers.begin(), consumers.end(), [](const FdConsumer& a, const FdConsumer& b) {
        return a.openCount > b.openCount;
    });
    if (consumers.size() > 5) consumers.resize(5);
    result.topConsumers = consumers;
    return result;
}
