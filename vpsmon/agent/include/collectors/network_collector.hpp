#pragma once

#include "collectors/snapshot.hpp"

#include <cstdint>
#include <map>
#include <string>
#include <vector>

class NetworkCollector {
public:
    std::vector<NetworkInterface> collect();

private:
    struct PrevCounters {
        uint64_t rxBytes = 0;
        uint64_t txBytes = 0;
        uint64_t rxPackets = 0;
        uint64_t txPackets = 0;
    };

    std::map<std::string, PrevCounters> prev_;
    std::map<std::string, int64_t> monthlyRx_;
    std::map<std::string, int64_t> monthlyTx_;
    int currentMonth_ = -1;

    void resetBandwidthIfNeeded();
    void addBandwidth(const std::string& iface, int64_t rxDelta, int64_t txDelta);
};
