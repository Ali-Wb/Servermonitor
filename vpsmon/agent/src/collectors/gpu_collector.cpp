#include "collectors/gpu_collector.hpp"

#include <array>
#include <cstdio>
#include <filesystem>
#include <fstream>
#include <sstream>

std::vector<GpuMetrics> GpuCollector::collect() const {
    std::vector<GpuMetrics> out;

    FILE* pipe = popen("nvidia-smi --query-gpu=name,utilization.gpu,memory.used,memory.total,temperature.gpu,power.draw --format=csv,noheader,nounits 2>/dev/null", "r");
    if (pipe) {
        std::array<char, 512> buffer{};
        while (fgets(buffer.data(), static_cast<int>(buffer.size()), pipe) != nullptr) {
            std::stringstream ss(buffer.data());
            GpuMetrics g;
            g.vendor = "nvidia";
            std::string token;
            std::getline(ss, g.model, ',');
            std::getline(ss, token, ','); g.usagePercent = token.empty() ? 0.0 : std::stod(token);
            std::getline(ss, token, ','); g.memoryUsedBytes = token.empty() ? 0 : static_cast<int64_t>(std::stod(token) * 1024 * 1024);
            std::getline(ss, token, ','); g.memoryTotalBytes = token.empty() ? 0 : static_cast<int64_t>(std::stod(token) * 1024 * 1024);
            std::getline(ss, token, ','); g.temperatureCelsius = token.empty() ? -1.0 : std::stod(token);
            std::getline(ss, token, ','); g.powerWatts = token.empty() ? -1.0 : std::stod(token);
            out.push_back(g);
        }
        pclose(pipe);
        if (!out.empty()) return out;
    }

    const std::filesystem::path amdPath("/sys/class/drm/card0/device");
    if (std::filesystem::exists(amdPath)) {
        GpuMetrics amd;
        amd.vendor = "amd";
        amd.model = "AMD GPU";
        out.push_back(amd);
    } else {
        GpuMetrics unavailable;
        unavailable.vendor = "unknown";
        unavailable.model = "No GPU";
        out.push_back(unavailable);
    }

    return out;
}
