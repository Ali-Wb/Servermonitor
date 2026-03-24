#pragma once

#include "collectors/snapshot.hpp"
#include "server/rate_limiter.hpp"
#include "storage/metrics_store.hpp"

#include <atomic>
#include <functional>
#include <string>
#include <unordered_set>
#include <vector>

class TcpServer {
public:
    using SnapshotSupplier = std::function<Snapshot()>;

    TcpServer(
        std::string bind,
        int port,
        SnapshotSupplier collector,
        MetricsStore& store,
        int rateLimitRps,
        const std::vector<std::string>& allowedIps,
        bool tuiAuthEnabled
    );

    virtual ~TcpServer() = default;

    std::string dispatch(const std::string& rawRequest, const std::string& ip);
    void handleClient(int fd, const std::string& ip);

protected:
    static std::string jsonOk(const std::string& data);
    static std::string jsonErr(const std::string& message);

private:
    std::string bind_;
    int port_;
    SnapshotSupplier collector_;
    MetricsStore& store_;
    RateLimiter rateLimiter_;
    bool tuiAuthEnabled_;
    std::atomic<int> activeClients_{0};
    std::unordered_set<std::string> validKeyHashes_;

    bool isLoopback(const std::string& ip) const;
    bool verifyKey(const std::string& key) const;
    static std::string hashKey(const std::string& key);
};

#ifdef VPSMON_TLS
class TlsServer : public TcpServer {
public:
    using TcpServer::TcpServer;
    bool initTls(const std::string& certFile, const std::string& keyFile);
};
#endif
