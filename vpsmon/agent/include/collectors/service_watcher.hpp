#pragma once

#include "collectors/snapshot.hpp"

#include <cstdint>
#include <map>
#include <string>
#include <vector>

class ServiceWatcher {
public:
    std::vector<ServiceStatus> collect(const std::vector<std::string>& services);

private:
    struct CacheEntry {
        int64_t tsMs = 0;
        ServiceStatus status;
    };

    std::map<std::string, CacheEntry> cache_;
};
