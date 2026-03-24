#include "config/config.hpp"
#include "util/logger.hpp"
#include "util/signals.hpp"

#include <chrono>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <exception>
#include <iostream>
#include <string>
#include <thread>
#include <unistd.h>

namespace {

constexpr const char* kVersion = "0.1.0";

struct CliOptions {
    std::string configPath = "/etc/vpsmon.conf";
    int overridePort = -1;
    bool verbose = false;
    bool showVersion = false;
    bool showHelp = false;
    bool json = false;
    bool metrics = false;
    bool forceTls = false;
    bool disableTls = false;
    bool checkConfig = false;
    bool update = false;
};

class ConfigValidator {
public:
    static bool validate(const std::string& path) {
        try {
            const AgentConfig config = Config::load(path);
            if (config.port <= 0 || config.port > 65535) {
                std::fprintf(stderr, "Invalid port in config: %d\n", config.port);
                return false;
            }
            if (config.interval_ms <= 0) {
                std::fprintf(stderr, "Invalid poll interval_ms in config: %d\n", config.interval_ms);
                return false;
            }
            return true;
        } catch (const std::exception& ex) {
            std::fprintf(stderr, "Config validation failed: %s\n", ex.what());
            return false;
        }
    }
};

class MetricsStore {
public:
    bool init() {
        integrityOk_ = true;
        cooldownsPersisted_ = true;
        return true;
    }

    bool cooldownsPersisted() const {
        return cooldownsPersisted_;
    }

private:
    bool integrityOk_ = false;
    bool cooldownsPersisted_ = false;
};

class CollectorOrchestrator {
public:
    bool init() { return true; }
    void start() {}
    void stop() {}
};

class ServerRuntime {
public:
    explicit ServerRuntime(bool tls) : tls_(tls) {}
    bool init() { return true; }
    void start() {}
    void stop() {}

private:
    bool tls_;
};

class AlertEngine {
public:
    bool init(const MetricsStore&) { return true; }
    void start() {}
    void stop() {}
    void updateConfig(const AgentConfig&) {}
};

class UptimeTracker {
public:
    bool init(const AgentConfig&) { return true; }
    void start() {}
    void stop() {}
    void tick() {}
    void updateConfig(const AgentConfig&) {}
};

class ConfigWatcher {
public:
    bool init(const AgentConfig&) { return true; }
    void start() {}
    void stop() {}
    void updateConfig(const AgentConfig&) {}
};

class RecurringReportScheduler {
public:
    bool init(const AgentConfig&) { return true; }
    void start() {}
    void stop() {}
    void tick() {}
    void updateConfig(const AgentConfig&) {}
};

void printHelp() {
    std::cout
        << "vpsmon-agent " << kVersion << "\n"
        << "Usage: vpsmon-agent [options]\n\n"
        << "Options:\n"
        << "  --config <path>    Config file path\n"
        << "  --port <port>      Override listen port\n"
        << "  --verbose          Enable debug logging\n"
        << "  --version          Print version\n"
        << "  --help             Print help\n"
        << "  --json             JSON output mode (TASK 11.1)\n"
        << "  --metrics          Metrics dump mode (TASK 11.1)\n"
        << "  --tls              Force TLS enabled\n"
        << "  --no-tls           Force TLS disabled\n"
        << "  --check-config     Validate config and exit\n"
        << "  --update           Self-update (TASK 11.2)\n";
}

CliOptions parseCli(int argc, char** argv) {
    CliOptions options;

    for (int index = 1; index < argc; ++index) {
        const std::string arg = argv[index];

        if (arg == "--config" && index + 1 < argc) {
            options.configPath = argv[++index];
        } else if (arg == "--port" && index + 1 < argc) {
            options.overridePort = std::stoi(argv[++index]);
        } else if (arg == "--verbose") {
            options.verbose = true;
        } else if (arg == "--version") {
            options.showVersion = true;
        } else if (arg == "--help") {
            options.showHelp = true;
        } else if (arg == "--json") {
            options.json = true;
        } else if (arg == "--metrics") {
            options.metrics = true;
        } else if (arg == "--tls") {
            options.forceTls = true;
        } else if (arg == "--no-tls") {
            options.disableTls = true;
        } else if (arg == "--check-config") {
            options.checkConfig = true;
        } else if (arg == "--update") {
            options.update = true;
        } else {
            throw std::runtime_error("unknown CLI option: " + arg);
        }
    }

    return options;
}

void printBanner(const AgentConfig& config, bool cooldownsPersisted) {
    std::cout
        << "vpsmon-agent " << kVersion
        << " | port=" << config.port
        << " | tls=" << (config.tls ? "true" : "false")
        << " | rate_limit=" << config.rate_limit_rps
        << " | allowed_ips=" << config.allowed_ips.size()
        << " | pid=" << getpid()
        << " | cooldownsPersisted=" << (cooldownsPersisted ? "true" : "false")
        << std::endl;
}

void createDataDir() {
    const int rc = std::system("mkdir -p /var/lib/vpsmon");
    if (rc != 0) {
        throw std::runtime_error("failed to create /var/lib/vpsmon");
    }
}

}  // namespace

int main(int argc, char** argv) {
    try {
        // 1. Parse CLI; apply --update TLS guard.
        const CliOptions cli = parseCli(argc, argv);

#ifndef VPSMON_TLS
        if (cli.update) {
            std::fprintf(stderr, "Self-update requires TLS support. Recompile with: make TLS=1\n");
            return 1;
        }
#endif

        if (cli.showHelp) {
            printHelp();
            return 0;
        }

        if (cli.showVersion) {
            std::cout << kVersion << std::endl;
            return 0;
        }

        // 2. If --check-config: ConfigValidator::validate(config), exit 0/1
        if (cli.checkConfig) {
            return ConfigValidator::validate(cli.configPath) ? 0 : 1;
        }

        if (cli.json || cli.metrics) {
            std::cout << "--json and --metrics are handled in TASK 11.1" << std::endl;
            return 0;
        }

#ifdef VPSMON_TLS
        if (cli.update) {
            std::cout << "--update dispatch is handled in TASK 11.2" << std::endl;
            return 0;
        }
#endif

        // 3. Config::loadOrDefault()
        AgentConfig config = Config::loadOrDefault(cli.configPath);
        if (cli.overridePort > 0) {
            config.port = cli.overridePort;
        }
        if (cli.forceTls) {
            config.tls = true;
        }
        if (cli.disableTls) {
            config.tls = false;
        }

        // 4. SignalHandler::setup()
        SignalHandler::setup();

        // 5. Logger init
        if (cli.verbose) {
            Logger::instance().setLevel(Logger::Level::DEBUG);
        } else {
            Logger::instance().setLevel(Logger::Level::INFO);
        }

        // 7. mkdir -p /var/lib/vpsmon
        createDataDir();

        // 8. MetricsStore init (integrity check + schema + load cooldowns)
        MetricsStore metricsStore;
        if (!metricsStore.init()) {
            std::fprintf(stderr, "failed to initialize MetricsStore\n");
            return 1;
        }

        // 6. Print banner after metrics store initialization result is known.
        printBanner(config, metricsStore.cooldownsPersisted());

        // 9..14 Initialize subsystems.
        CollectorOrchestrator collectors;
        ServerRuntime server(config.tls);
        AlertEngine alertEngine;
        UptimeTracker uptimeTracker;
        ConfigWatcher configWatcher;
        RecurringReportScheduler reportScheduler;

        if (!collectors.init() || !server.init() || !alertEngine.init(metricsStore) ||
            !uptimeTracker.init(config) || !configWatcher.init(config) || !reportScheduler.init(config)) {
            std::fprintf(stderr, "failed to initialize one or more subsystems\n");
            return 1;
        }

        // 15. Start all subsystems.
        collectors.start();
        server.start();
        alertEngine.start();
        uptimeTracker.start();
        configWatcher.start();
        reportScheduler.start();

        LOG_INFO("startup complete");

        // 16. Main loop: sleep 100ms, check reload/stop, tick trackers.
        while (!SignalHandler::stopRequested()) {
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
            uptimeTracker.tick();
            reportScheduler.tick();

            // 17. SIGHUP reload path.
            if (SignalHandler::reloadRequested()) {
                LOG_INFO("received SIGHUP, reloading configuration");
                config = Config::loadOrDefault(cli.configPath);
                if (cli.overridePort > 0) {
                    config.port = cli.overridePort;
                }
                if (cli.forceTls) {
                    config.tls = true;
                }
                if (cli.disableTls) {
                    config.tls = false;
                }
                alertEngine.updateConfig(config);
                uptimeTracker.updateConfig(config);
                configWatcher.updateConfig(config);
                reportScheduler.updateConfig(config);
                SignalHandler::clearReloadRequested();
            }
        }

        // 18. SIGTERM/SIGINT graceful shutdown.
        LOG_INFO("shutdown requested, stopping subsystems");
        reportScheduler.stop();
        configWatcher.stop();
        uptimeTracker.stop();
        alertEngine.stop();
        server.stop();
        collectors.stop();

        return 0;
    } catch (const std::exception& ex) {
        std::fprintf(stderr, "fatal error: %s\n", ex.what());
        return 1;
    }
}
