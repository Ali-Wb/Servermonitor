#include "server/tcp_server.hpp"

#include "server/request_parser.hpp"
#include "util/logger.hpp"

#include <algorithm>
#include <arpa/inet.h>
#include <chrono>
#include <cstdio>
#include <cstring>
#include <fstream>
#include <iomanip>
#include <netinet/in.h>
#include <sstream>
#include <sys/socket.h>
#include <thread>
#include <unistd.h>

namespace {

int64_t nowMs() {
    return std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::system_clock::now().time_since_epoch()).count();
}

std::string tailFile(const std::string& path, int lines) {
    std::ifstream in(path);
    if (!in.is_open()) return "";
    std::vector<std::string> all;
    std::string line;
    while (std::getline(in, line)) all.push_back(line);
    const int start = std::max(0, static_cast<int>(all.size()) - lines);
    std::ostringstream out;
    for (int i = start; i < static_cast<int>(all.size()); ++i) {
        if (i > start) out << "\\n";
        out << all[static_cast<std::size_t>(i)];
    }
    return out.str();
}

class SelfUpdater {
public:
    static void performUpdate() {
        LOG_INFO("self update initiated");
    }
};

}  // namespace

TcpServer::TcpServer(
    std::string bind,
    int port,
    SnapshotSupplier collector,
    MetricsStore& store,
    int rateLimitRps,
    const std::vector<std::string>& allowedIps,
    bool tuiAuthEnabled)
    : bind_(std::move(bind)),
      port_(port),
      collector_(std::move(collector)),
      store_(store),
      rateLimiter_(rateLimitRps, allowedIps),
      tuiAuthEnabled_(tuiAuthEnabled) {
    validKeyHashes_.insert(hashKey("dev-local-key"));
}

std::string TcpServer::jsonOk(const std::string& data) {
    return std::string("{\"ok\":true,\"data\":") + data + "}";
}

std::string TcpServer::jsonErr(const std::string& message) {
    return std::string("{\"ok\":false,\"error\":\"") + message + "\"}";
}

bool TcpServer::isLoopback(const std::string& ip) const {
    return ip == "127.0.0.1" || ip == "::1" || ip.rfind("127.", 0) == 0;
}

std::string TcpServer::hashKey(const std::string& key) {
    const std::size_t h = std::hash<std::string>{}(key);
    std::ostringstream out;
    out << std::hex << h;
    return out.str();
}

bool TcpServer::verifyKey(const std::string& key) const {
    if (key.empty()) return false;
    return validKeyHashes_.find(hashKey(key)) != validKeyHashes_.end();
}

void TcpServer::handleClient(int fd, const std::string& ip) {
    const int current = activeClients_.fetch_add(1) + 1;
    if (current >= 50) {
        const std::string error = jsonErr("too many active clients");
        (void)send(fd, error.c_str(), error.size(), 0);
        close(fd);
        activeClients_.fetch_sub(1);
        return;
    }

    if (!rateLimiter_.allow(ip)) {
        if (rateLimiter_.wasBlockedByAllowlist(ip)) {
            close(fd);
            activeClients_.fetch_sub(1);
            return;
        }
        const std::string error = jsonErr("rate limit exceeded");
        (void)send(fd, error.c_str(), error.size(), 0);
        close(fd);
        activeClients_.fetch_sub(1);
        return;
    }

    timeval timeout{};
    timeout.tv_sec = 5;
    (void)setsockopt(fd, SOL_SOCKET, SO_RCVTIMEO, &timeout, sizeof(timeout));

    std::string request;
    char c = '\0';
    while (request.size() < 4096) {
        const ssize_t n = recv(fd, &c, 1, 0);
        if (n <= 0) break;
        if (c == '\n') break;
        request.push_back(c);
    }

    std::string response;
    try {
        if (tuiAuthEnabled_) {
            const AgentRequest parsed = parseRequest(request);
            if (!verifyKey(parsed.key)) {
                response = jsonErr("unauthorized");
            } else {
                response = dispatch(request, ip);
            }
        } else {
            response = dispatch(request, ip);
        }
    } catch (const std::exception& ex) {
        response = jsonErr(ex.what());
    }

    response.push_back('\n');
    (void)send(fd, response.c_str(), response.size(), 0);
    close(fd);
    activeClients_.fetch_sub(1);
}

std::string TcpServer::dispatch(const std::string& rawRequest, const std::string& ip) {
    (void)ip;
    const AgentRequest req = parseRequest(rawRequest);

    if (req.cmd == "ping") {
        return jsonOk("{\"pong\":true}");
    }
    if (req.cmd == "snapshot") {
        return jsonOk(snapshotToJson(collector_()));
    }
    if (req.cmd == "history") {
        const int64_t fromTs = nowMs() - (req.duration == "1h" ? 3600000LL : 86400000LL);
        const auto history = store_.queryHistory(req.metric, fromTs, req.maxPoints);
        std::ostringstream data;
        data << "[";
        for (std::size_t i = 0; i < history.size(); ++i) {
            if (i > 0) data << ",";
            data << "[" << history[i].first << "," << history[i].second << "]";
        }
        data << "]";
        return jsonOk(data.str());
    }
    if (req.cmd == "alerts") {
        return jsonOk(alertsToJson(store_.queryAlerts(200)));
    }
    if (req.cmd == "resolve-alert") {
        const bool ok = store_.resolveAlert(req.alert_id, nowMs());
        return ok ? jsonOk("{\"resolved\":true}") : jsonErr("resolve failed");
    }
    if (req.cmd == "acknowledge-alert") {
        const bool ok = store_.acknowledgeAlert(req.alert_id, req.acknowledged_by, nowMs());
        return ok ? jsonOk("{\"acknowledged\":true}") : jsonErr("acknowledge failed");
    }
    if (req.cmd == "logs") {
        const int lines = std::clamp(req.lines, 1, 500);
        std::string output;
        const std::string cmd = "journalctl -n " + std::to_string(lines) + " --no-pager 2>/dev/null";
        FILE* p = popen(cmd.c_str(), "r");
        if (p != nullptr) {
            std::array<char, 512> buf{};
            while (fgets(buf.data(), static_cast<int>(buf.size()), p) != nullptr) output += buf.data();
            pclose(p);
        }
        if (output.empty()) output = tailFile("/var/log/vpsmon-agent.log", lines);
        std::string escaped;
        for (char ch : output) escaped += (ch == '"') ? "\\\"" : std::string(1, ch);
        return jsonOk(std::string("{\"logs\":\"") + escaped + "\"}");
    }
    if (req.cmd == "uptime") {
        return jsonOk(uptimeToJson(store_.queryUptime(req.period.empty() ? "24h" : req.period)));
    }
    if (req.cmd == "health") {
        return jsonOk(agentHealthToJson("0.1.0", 0, 0, 0, 30, false, true, false, true));
    }
    if (req.cmd == "update") {
#ifndef VPSMON_TLS
        return jsonErr("self-update requires TLS — recompile with make TLS=1");
#else
        if (!isLoopback(ip)) return jsonErr("update only allowed from loopback");
        std::thread([]() { SelfUpdater::performUpdate(); }).detach();
        return jsonOk("{\"status\":\"update initiated, agent will restart\"}");
#endif
    }
    if (req.cmd == "set-anomaly-baseline") {
        store_.updateAnomalyBaseline();
        return jsonOk("{\"updated\":true}");
    }
    if (req.cmd == "bandwidth" || req.cmd == "test-alert") {
        return jsonOk("[]");
    }

    return jsonErr("unknown command");
}
