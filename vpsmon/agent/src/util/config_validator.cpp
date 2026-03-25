#include "util/config_validator.hpp"

#include <algorithm>
#include <arpa/inet.h>
#include <cstdlib>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <sstream>
#include <sys/stat.h>
#include <unistd.h>

namespace {

void add(std::vector<CheckResult>& out, std::string name, CheckResult::Status status, std::string message) {
    out.push_back(CheckResult{std::move(name), status, std::move(message)});
}

bool cmdOk(const std::string& cmd) {
    const int rc = std::system(cmd.c_str());
    return rc == 0;
}

bool validIp(const std::string& ip) {
    sockaddr_in sa4{};
    sockaddr_in6 sa6{};
    return inet_pton(AF_INET, ip.c_str(), &sa4.sin_addr) == 1 || inet_pton(AF_INET6, ip.c_str(), &sa6.sin6_addr) == 1;
}

}  // namespace

std::vector<CheckResult> ConfigValidator::validate(const AgentConfig& config, bool updateRequested) {
    std::vector<CheckResult> out;

    const std::filesystem::path dbPath(config.db_path);
    const std::filesystem::path parent = dbPath.parent_path().empty() ? std::filesystem::path(".") : dbPath.parent_path();
    add(out,
        "db_path parent writable",
        access(parent.c_str(), W_OK) == 0 ? CheckResult::Status::PASS : CheckResult::Status::FAIL,
        parent.string());

    if (config.tls) {
        const bool certReadable = access(config.tls_cert.c_str(), R_OK) == 0;
        const bool keyReadable = access(config.tls_key.c_str(), R_OK) == 0;
        add(out, "TLS cert readable", certReadable ? CheckResult::Status::PASS : CheckResult::Status::FAIL, config.tls_cert);
        add(out, "TLS key readable", keyReadable ? CheckResult::Status::PASS : CheckResult::Status::FAIL, config.tls_key);
    }

    if (config.docker_enabled) {
        struct stat st {};
        const bool exists = stat("/var/run/docker.sock", &st) == 0;
        add(out, "Docker socket exists", exists ? CheckResult::Status::PASS : CheckResult::Status::FAIL, "/var/run/docker.sock");
    }

    if (config.gpu_backend == "nvidia" || config.gpu_backend == "auto") {
        add(out,
            "nvidia-smi in PATH",
            cmdOk("command -v nvidia-smi >/dev/null 2>&1") ? CheckResult::Status::PASS : CheckResult::Status::WARN,
            "required for NVIDIA metrics");
    }

    for (const std::string& service : config.services) {
        const bool ok = cmdOk("systemctl list-unit-files | grep -q '^" + service + "\\.service'");
        add(out, "service exists: " + service, ok ? CheckResult::Status::PASS : CheckResult::Status::WARN, service);
    }

    const std::vector<std::string> urls = {config.slack_webhook_url, config.discord_webhook_url, config.webhook_url};
    for (const std::string& url : urls) {
        if (url.empty()) continue;
        const bool ok = cmdOk("curl -I -m 3 -fsS '" + url + "' >/dev/null 2>&1");
        add(out, "webhook reachable", ok ? CheckResult::Status::PASS : CheckResult::Status::WARN, url);
    }

    if (!config.maintenance_check_url.empty()) {
        const bool ok = cmdOk("curl -m 3 -fsS '" + config.maintenance_check_url + "' | grep -q '\"active\"'");
        add(out, "maintenance_check_url reachable", ok ? CheckResult::Status::PASS : CheckResult::Status::WARN, config.maintenance_check_url);
    }

    if (config.dns_enabled) {
        const bool ok = !config.dns_check_hosts.empty();
        add(out, "dns hosts configured", ok ? CheckResult::Status::PASS : CheckResult::Status::FAIL, ok ? "configured" : "empty");
    }

    const bool smtpNeeded = config.recurring_reports_enabled || std::find(config.channels_enabled.begin(), config.channels_enabled.end(), "smtp") != config.channels_enabled.end();
    if (smtpNeeded) {
        add(out,
            "smtp host configured",
            !config.smtp_host.empty() ? CheckResult::Status::PASS : CheckResult::Status::FAIL,
            config.smtp_host.empty() ? "smtp_host is empty" : config.smtp_host);
    }

    for (const std::string& ip : config.allowed_ips) {
        add(out, "allowed_ips format: " + ip, validIp(ip) ? CheckResult::Status::PASS : CheckResult::Status::FAIL, ip);
    }

#ifdef VPSMON_TLS
    const bool tlsCompiled = true;
#else
    const bool tlsCompiled = false;
#endif
    if (updateRequested) {
        add(out,
            "self-update TLS compiled",
            tlsCompiled ? CheckResult::Status::PASS : CheckResult::Status::FAIL,
            tlsCompiled ? "VPSMON_TLS available" : "recompile with make TLS=1");
    }

    return out;
}

int ConfigValidator::printResults(const std::vector<CheckResult>& results) {
    bool hasFail = false;
    for (const CheckResult& r : results) {
        const char* icon = r.status == CheckResult::Status::PASS ? "✓" : (r.status == CheckResult::Status::WARN ? "⚠" : "✗");
        std::cout << icon << " " << r.name << " — " << r.message << "\n";
        if (r.status == CheckResult::Status::FAIL) hasFail = true;
    }
    return hasFail ? 1 : 0;
}
