#pragma once

#include <deque>
#include <mutex>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <vector>

class RateLimiter {
public:
    RateLimiter(int maxRps, const std::vector<std::string>& allowedIps);

    bool allow(const std::string& ip);
    bool wasBlockedByAllowlist(const std::string& ip) const;
    void evictStale();

private:
    int maxRps_;
    std::unordered_set<std::string> allowedIps_;
    mutable std::mutex mutex_;
    std::unordered_map<std::string, std::deque<int64_t>> requestsMs_;
    std::unordered_map<std::string, bool> lastAllowlistBlocked_;

    static bool isLoopback(const std::string& ip);
    static int64_t nowMs();
};
