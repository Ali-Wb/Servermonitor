#include "collectors/service_watcher.hpp"

#include <array>
#include <chrono>
#include <cstdio>

namespace {

int64_t nowMs() {
    return std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::system_clock::now().time_since_epoch()).count();
}

std::string trimNewline(const std::string& input) {
    if (!input.empty() && input.back() == '\n') {
        return input.substr(0, input.size() - 1);
    }
    return input;
}

}  // namespace

std::vector<ServiceStatus> ServiceWatcher::collect(const std::vector<std::string>& services) {
    std::vector<ServiceStatus> out;
    const int64_t now = nowMs();

    for (const std::string& name : services) {
        const auto cacheIt = cache_.find(name);
        if (cacheIt != cache_.end() && now - cacheIt->second.tsMs < 5000) {
            out.push_back(cacheIt->second.status);
            continue;
        }

        std::string command = "systemctl is-active " + name + " 2>/dev/null";
        FILE* pipe = popen(command.c_str(), "r");

        ServiceStatus status;
        status.name = name;
        status.since = now;

        if (!pipe) {
            status.status = "unknown";
            status.message = "popen failed";
        } else {
            std::array<char, 128> buffer{};
            std::string output;
            while (fgets(buffer.data(), static_cast<int>(buffer.size()), pipe) != nullptr) {
                output += buffer.data();
            }
            pclose(pipe);

            output = trimNewline(output);
            if (output == "active") status.status = "running";
            else if (output == "failed") status.status = "failed";
            else if (output == "inactive" || output == "deactivating") status.status = "stopped";
            else status.status = "unknown";
            status.message = output;
        }

        cache_[name] = {now, status};
        out.push_back(status);
    }

    return out;
}
