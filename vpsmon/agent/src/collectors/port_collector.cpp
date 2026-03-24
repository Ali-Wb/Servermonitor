#include "collectors/port_collector.hpp"

#include <algorithm>
#include <fstream>
#include <set>
#include <sstream>
#include <string>
#include <tuple>

namespace {

int parseHexPort(const std::string& endpoint) {
    const std::size_t colon = endpoint.find(':');
    if (colon == std::string::npos) return 0;
    return std::stoi(endpoint.substr(colon + 1), nullptr, 16);
}

void parseProcNetFile(const std::string& path, const std::string& protocol, bool onlyListen, std::set<std::tuple<int, std::string>>& dedupe, std::vector<OpenPort>& out) {
    std::ifstream file(path);
    std::string line;
    int lineNo = 0;

    while (std::getline(file, line)) {
        ++lineNo;
        if (lineNo == 1) continue;

        std::stringstream ss(line);
        std::string sl;
        std::string localAddress;
        std::string remAddress;
        std::string state;
        ss >> sl >> localAddress >> remAddress >> state;

        if (onlyListen && state != "0A") {
            continue;
        }

        const int port = parseHexPort(localAddress);
        if (port == 0) continue;

        const auto key = std::make_tuple(port, protocol);
        if (!dedupe.insert(key).second) {
            continue;
        }

        OpenPort entry;
        entry.protocol = protocol;
        entry.port = port;
        entry.address = localAddress;
        entry.processName = "";
        entry.pid = 0;
        out.push_back(entry);
    }
}

}  // namespace

std::vector<OpenPort> PortCollector::collect() const {
    std::vector<OpenPort> ports;
    std::set<std::tuple<int, std::string>> dedupe;

    parseProcNetFile("/proc/net/tcp", "tcp", true, dedupe, ports);
    parseProcNetFile("/proc/net/tcp6", "tcp", true, dedupe, ports);
    parseProcNetFile("/proc/net/udp", "udp", false, dedupe, ports);

    std::sort(ports.begin(), ports.end(), [](const OpenPort& a, const OpenPort& b) {
        if (a.port == b.port) {
            return a.protocol < b.protocol;
        }
        return a.port < b.port;
    });

    return ports;
}
