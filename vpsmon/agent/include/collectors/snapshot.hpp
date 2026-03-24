#pragma once

#include <cstdint>
#include <string>
#include <vector>

struct CpuCore {
    int id = 0;
    std::string label;
    double usagePercent = 0.0;
    double temperatureCelsius = -1.0;
};

struct CpuMetrics {
    double usagePercent = 0.0;
    double loadAverage1m = 0.0;
    double loadAverage5m = 0.0;
    double loadAverage15m = 0.0;
    double temperatureCelsius = -1.0;
    std::vector<CpuCore> cores;
};

struct RamMetrics {
    int64_t totalBytes = 0;
    int64_t usedBytes = 0;
    int64_t freeBytes = 0;
    int64_t cachedBytes = 0;
    int64_t bufferedBytes = 0;
    int64_t swapTotalBytes = 0;
    int64_t swapUsedBytes = 0;
    double usagePercent = 0.0;
};

struct DiskMount {
    std::string mountpoint;
    std::string filesystem;
    int64_t totalBytes = 0;
    int64_t usedBytes = 0;
    int64_t freeBytes = 0;
    double usagePercent = 0.0;
    double readBytesPerSecond = 0.0;
    double writeBytesPerSecond = 0.0;
    double ioLatencyMs = -1.0;
    double daysUntilFull = -1.0;
    double predictedUsage7d = -1.0;
};

struct NetworkInterface {
    std::string name;
    double rxBytesPerSecond = 0.0;
    double txBytesPerSecond = 0.0;
    double rxPacketsPerSecond = 0.0;
    double txPacketsPerSecond = 0.0;
    int64_t rxErrors = 0;
    int64_t txErrors = 0;
    int64_t monthlyRxBytes = 0;
    int64_t monthlyTxBytes = 0;
};

struct BandwidthPeriod {
    std::string label;
    int64_t start = 0;
    int64_t end = 0;
    int64_t rxBytes = 0;
    int64_t txBytes = 0;
    int64_t totalBytes = 0;
};

struct GpuMetrics {
    std::string vendor = "unknown";
    std::string model;
    double usagePercent = 0.0;
    int64_t memoryUsedBytes = 0;
    int64_t memoryTotalBytes = 0;
    double temperatureCelsius = -1.0;
    double powerWatts = -1.0;
};

struct DockerContainer {
    std::string id;
    std::string name;
    std::string image;
    std::string state;
    std::string status;
    double cpuPercent = 0.0;
    int64_t memoryUsageBytes = 0;
    int64_t memoryLimitBytes = 0;
    int64_t uptimeSeconds = 0;
};

struct FdConsumer {
    int pid = 0;
    std::string name;
    int openCount = 0;
};

struct FdMetrics {
    int open = 0;
    int limit = 0;
    double usagePercent = 0.0;
    std::vector<FdConsumer> topConsumers;
};

struct DnsProbeResult {
    std::string host;
    std::string recordType;
    double latencyMs = -1.0;
    bool success = false;
    std::string error;
    int64_t checkedAt = 0;
};

struct HealthcheckResult {
    std::string id;
    std::string command;
    int exitCode = 0;
    int64_t durationMs = 0;
    std::string stdoutText;
    std::string stderrText;
    std::string status;
    int64_t checkedAt = 0;
};

struct ProcessInfo {
    int pid = 0;
    std::string name;
    double cpuPercent = 0.0;
    double memoryPercent = 0.0;
    int64_t rssBytes = 0;
    std::string state;
};

struct ServiceStatus {
    std::string name;
    std::string status;
    int64_t since = 0;
    std::string message;
};

struct OpenPort {
    std::string protocol;
    int port = 0;
    std::string address;
    std::string processName;
    int pid = 0;
};

struct Snapshot {
    int64_t timestamp = 0;
    std::string hostname;
    int64_t uptimeSeconds = 0;
    CpuMetrics cpu;
    RamMetrics ram;
    std::vector<DiskMount> disks;
    std::vector<NetworkInterface> network;
    std::vector<BandwidthPeriod> bandwidth;
    std::vector<GpuMetrics> gpu;
    std::vector<DockerContainer> docker;
    FdMetrics fd;
    std::vector<DnsProbeResult> dns;
    std::vector<HealthcheckResult> healthchecks;
    std::vector<ProcessInfo> processes;
    std::vector<ServiceStatus> services;
    std::vector<OpenPort> openPorts;
};

struct AlertComment {
    std::string id;
    std::string text;
    std::string author;
    int64_t createdAt = 0;
};

struct AlertRow {
    int id = 0;
    int64_t timestamp = 0;
    std::string metric;
    double value = 0.0;
    double threshold = 0.0;
    std::string message;
    std::string severity;
    int64_t resolved_at = 0;
    bool acknowledged = false;
    std::string acknowledged_by;
    int64_t acknowledged_at = 0;
    bool is_anomaly = false;
    double anomaly_sigma = 0.0;
    bool suppressed = false;
    std::string suppressedReason;
    std::vector<AlertComment> comments;
};

struct UptimeGap {
    int64_t start = 0;
    int64_t end = 0;
};

struct UptimeStats {
    std::string period;
    double uptimePercent = 0.0;
    int64_t expectedSeconds = 0;
    int64_t uptimeSeconds = 0;
    std::vector<UptimeGap> gaps;
};

std::string snapshotToJson(const Snapshot& snapshot);
std::string alertsToJson(const std::vector<AlertRow>& alerts);
std::string uptimeToJson(const UptimeStats& stats);
std::string agentHealthToJson(
    const std::string& version,
    int64_t uptimeSeconds,
    int64_t dbSizeBytes,
    int64_t totalMetricRows,
    int retentionDays,
    bool tlsEnabled,
    bool anomalyEnabled,
    bool maintenanceActive,
    bool cooldownsPersisted
);
