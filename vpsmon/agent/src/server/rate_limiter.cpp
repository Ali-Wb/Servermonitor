#include "server/rate_limiter.hpp"

#include <algorithm>
#include <chrono>

RateLimiter::RateLimiter(int maxRps, const std::vector<std::string>& allowedIps)
    : maxRps_(std::max(1, maxRps)),
      allowedIps_(allowedIps.begin(), allowedIps.end()) {
}

int64_t RateLimiter::nowMs() {
    return std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::system_clock::now().time_since_epoch()).count();
}

bool RateLimiter::isLoopback(const std::string& ip) {
    return ip == "127.0.0.1" || ip == "::1" || ip.rfind("127.", 0) == 0;
}

void RateLimiter::evictStale() {
    std::lock_guard<std::mutex> lock(mutex_);
    const int64_t cutoff = nowMs() - 60000;
    for (auto it = requestsMs_.begin(); it != requestsMs_.end();) {
        auto& dq = it->second;
        while (!dq.empty() && dq.front() < cutoff) dq.pop_front();
        if (dq.empty()) {
            it = requestsMs_.erase(it);
        } else {
            ++it;
        }
    }
}

bool RateLimiter::allow(const std::string& ip) {
    std::lock_guard<std::mutex> lock(mutex_);
    lastAllowlistBlocked_[ip] = false;

    if (!allowedIps_.empty() && allowedIps_.find(ip) == allowedIps_.end()) {
        lastAllowlistBlocked_[ip] = true;
        return false;
    }

    if (isLoopback(ip)) {
        return true;
    }

    const int64_t now = nowMs();
    auto& dq = requestsMs_[ip];
    while (!dq.empty() && dq.front() <= (now - 1000)) dq.pop_front();
    if (static_cast<int>(dq.size()) >= maxRps_) {
        return false;
    }
    dq.push_back(now);
    return true;
}

bool RateLimiter::wasBlockedByAllowlist(const std::string& ip) const {
    std::lock_guard<std::mutex> lock(mutex_);
    const auto it = lastAllowlistBlocked_.find(ip);
    return it != lastAllowlistBlocked_.end() && it->second;
}
