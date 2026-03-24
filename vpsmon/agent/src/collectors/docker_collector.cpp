#include "collectors/docker_collector.hpp"

#include <chrono>
#include <ctime>
#include <iomanip>
#include <sstream>
#include <string>
#include <sys/socket.h>
#include <sys/un.h>
#include <unistd.h>

namespace {
int64_t nowMs() {
    return std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::system_clock::now().time_since_epoch()).count();
}
}

DockerCollector::DockerCollector() : cacheTsMs_(0) {}

std::string DockerCollector::httpGetUnixSocket(const std::string& path) const {
    int fd = socket(AF_UNIX, SOCK_STREAM, 0);
    if (fd < 0) return "";

    sockaddr_un addr{};
    addr.sun_family = AF_UNIX;
    std::snprintf(addr.sun_path, sizeof(addr.sun_path), "/var/run/docker.sock");
    if (connect(fd, reinterpret_cast<sockaddr*>(&addr), sizeof(addr)) != 0) {
        close(fd);
        return "";
    }

    std::string req = "GET " + path + " HTTP/1.0\r\nHost: docker\r\n\r\n";
    send(fd, req.data(), req.size(), 0);

    std::string response;
    char buf[1024];
    ssize_t n = 0;
    while ((n = recv(fd, buf, sizeof(buf), 0)) > 0) {
        response.append(buf, static_cast<std::size_t>(n));
    }
    close(fd);

    const std::size_t bodyPos = response.find("\r\n\r\n");
    return bodyPos == std::string::npos ? "" : response.substr(bodyPos + 4);
}

int64_t DockerCollector::parseRfc3339ToEpochSeconds(const std::string& created) {
    std::tm tm{};
    std::istringstream ss(created.substr(0, 19));
    ss >> std::get_time(&tm, "%Y-%m-%dT%H:%M:%S");
    if (ss.fail()) return 0;
    return static_cast<int64_t>(timegm(&tm));
}

std::vector<DockerContainer> DockerCollector::getContainers() {
    const int64_t now = nowMs();
    if (now - cacheTsMs_ < 5000 && !containersCache_.empty()) {
        return containersCache_;
    }

    std::vector<DockerContainer> out;
    const std::string payload = httpGetUnixSocket("/containers/json");
    if (payload.empty()) {
        cacheTsMs_ = now;
        containersCache_ = out;
        return out;
    }

    std::size_t pos = 0;
    while ((pos = payload.find("\"Id\":\"", pos)) != std::string::npos) {
        DockerContainer c;
        pos += 6;
        const std::size_t idEnd = payload.find('"', pos);
        c.id = payload.substr(pos, idEnd - pos);

        const std::size_t imagePos = payload.find("\"Image\":\"", idEnd);
        if (imagePos != std::string::npos) {
            const std::size_t start = imagePos + 9;
            const std::size_t end = payload.find('"', start);
            c.image = payload.substr(start, end - start);
        }

        c.name = c.id.substr(0, std::min<std::size_t>(12, c.id.size()));
        c.state = "running";
        c.status = "up";
        c.cpuPercent = statsCache_[c.id].cpuPercent;
        c.memoryUsageBytes = statsCache_[c.id].memoryUsageBytes;
        c.memoryLimitBytes = statsCache_[c.id].memoryLimitBytes;
        c.uptimeSeconds = statsCache_[c.id].uptimeSeconds;

        out.push_back(c);
        pos = idEnd;
    }

    cacheTsMs_ = now;
    containersCache_ = out;
    return out;
}
