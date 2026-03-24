#include "collectors/network_collector.hpp"

#include "util/logger.hpp"

#include <chrono>
#include <ctime>
#include <fstream>
#include <sstream>
#include <string>

void NetworkCollector::resetBandwidthIfNeeded() {
    const auto now = std::chrono::system_clock::to_time_t(std::chrono::system_clock::now());
    std::tm tmNow{};
    localtime_r(&now, &tmNow);

    if (currentMonth_ == -1) {
        currentMonth_ = tmNow.tm_mon;
        return;
    }

    if (tmNow.tm_mon != currentMonth_) {
        monthlyRx_.clear();
        monthlyTx_.clear();
        currentMonth_ = tmNow.tm_mon;
    }
}

void NetworkCollector::addBandwidth(const std::string& iface, int64_t rxDelta, int64_t txDelta) {
    monthlyRx_[iface] += rxDelta;
    monthlyTx_[iface] += txDelta;
}

std::vector<NetworkInterface> NetworkCollector::collect() {
    resetBandwidthIfNeeded();

    std::ifstream file("/proc/net/dev");
    std::string line;
    std::vector<NetworkInterface> interfaces;
    int lineNumber = 0;

    while (std::getline(file, line)) {
        ++lineNumber;
        if (lineNumber <= 2) {
            continue;
        }

        const std::size_t colon = line.find(':');
        if (colon == std::string::npos) {
            continue;
        }

        std::string name = line.substr(0, colon);
        name.erase(0, name.find_first_not_of(' '));
        name.erase(name.find_last_not_of(' ') + 1);

        std::stringstream ss(line.substr(colon + 1));
        uint64_t rxBytes = 0;
        uint64_t rxPackets = 0;
        uint64_t rxErrs = 0;
        uint64_t rxDrop = 0;
        uint64_t rxFifo = 0;
        uint64_t rxFrame = 0;
        uint64_t rxCompressed = 0;
        uint64_t rxMulticast = 0;
        uint64_t txBytes = 0;
        uint64_t txPackets = 0;
        uint64_t txErrs = 0;
        uint64_t txDrop = 0;
        uint64_t txFifo = 0;
        uint64_t txColls = 0;
        uint64_t txCarrier = 0;
        uint64_t txCompressed = 0;

        ss >> rxBytes >> rxPackets >> rxErrs >> rxDrop >> rxFifo >> rxFrame >> rxCompressed >> rxMulticast
           >> txBytes >> txPackets >> txErrs >> txDrop >> txFifo >> txColls >> txCarrier >> txCompressed;

        NetworkInterface iface;
        iface.name = name;
        iface.rxErrors = static_cast<int64_t>(rxErrs);
        iface.txErrors = static_cast<int64_t>(txErrs);

        const auto prevIt = prev_.find(name);
        if (prevIt == prev_.end()) {
            iface.rxBytesPerSecond = 0.0;
            iface.txBytesPerSecond = 0.0;
            iface.rxPacketsPerSecond = 0.0;
            iface.txPacketsPerSecond = 0.0;
        } else {
            const PrevCounters& prev = prevIt->second;

            const int64_t rxDelta = (rxBytes < prev.rxBytes)
                ? static_cast<int64_t>(rxBytes)
                : static_cast<int64_t>(rxBytes - prev.rxBytes);
            const int64_t txDelta = (txBytes < prev.txBytes)
                ? static_cast<int64_t>(txBytes)
                : static_cast<int64_t>(txBytes - prev.txBytes);

            if (rxBytes < prev.rxBytes || txBytes < prev.txBytes) {
                LOG_WARN("network counter wrap detected on interface " + name);
            }

            const int64_t rxPacketsDelta = (rxPackets < prev.rxPackets)
                ? static_cast<int64_t>(rxPackets)
                : static_cast<int64_t>(rxPackets - prev.rxPackets);
            const int64_t txPacketsDelta = (txPackets < prev.txPackets)
                ? static_cast<int64_t>(txPackets)
                : static_cast<int64_t>(txPackets - prev.txPackets);

            iface.rxBytesPerSecond = static_cast<double>(rxDelta);
            iface.txBytesPerSecond = static_cast<double>(txDelta);
            iface.rxPacketsPerSecond = static_cast<double>(rxPacketsDelta);
            iface.txPacketsPerSecond = static_cast<double>(txPacketsDelta);

            addBandwidth(name, rxDelta, txDelta);
        }

        iface.monthlyRxBytes = monthlyRx_[name];
        iface.monthlyTxBytes = monthlyTx_[name];

        prev_[name] = {rxBytes, txBytes, rxPackets, txPackets};
        interfaces.push_back(iface);
    }

    return interfaces;
}
