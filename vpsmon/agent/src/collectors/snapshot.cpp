#include "collectors/snapshot.hpp"

#include <iomanip>
#include <sstream>

namespace {

std::string escapeJson(const std::string& input) {
    std::ostringstream out;
    for (const char ch : input) {
        switch (ch) {
            case '\\': out << "\\\\"; break;
            case '"': out << "\\\""; break;
            case '\n': out << "\\n"; break;
            case '\r': out << "\\r"; break;
            case '\t': out << "\\t"; break;
            default: out << ch; break;
        }
    }
    return out.str();
}

std::string q(const std::string& value) {
    return "\"" + escapeJson(value) + "\"";
}

std::string numOrNull(double value) {
    if (value == -1.0) {
        return "null";
    }
    std::ostringstream out;
    out << std::fixed << std::setprecision(3) << value;
    return out.str();
}

std::string boolJson(bool value) {
    return value ? "true" : "false";
}

}  // namespace

std::string snapshotToJson(const Snapshot& s) {
    std::ostringstream out;
    out << "{";
    out << "\"timestamp\":" << s.timestamp << ",";
    out << "\"hostname\":" << q(s.hostname) << ",";
    out << "\"uptimeSeconds\":" << s.uptimeSeconds << ",";

    out << "\"cpu\":{";
    out << "\"usagePercent\":" << numOrNull(s.cpu.usagePercent) << ",";
    out << "\"loadAverage1m\":" << numOrNull(s.cpu.loadAverage1m) << ",";
    out << "\"loadAverage5m\":" << numOrNull(s.cpu.loadAverage5m) << ",";
    out << "\"loadAverage15m\":" << numOrNull(s.cpu.loadAverage15m) << ",";
    out << "\"temperatureCelsius\":" << numOrNull(s.cpu.temperatureCelsius) << ",";
    out << "\"cores\":[";
    for (std::size_t i = 0; i < s.cpu.cores.size(); ++i) {
        const CpuCore& c = s.cpu.cores[i];
        if (i > 0) out << ",";
        out << "{";
        out << "\"id\":" << c.id << ",";
        out << "\"label\":" << q(c.label) << ",";
        out << "\"usagePercent\":" << numOrNull(c.usagePercent) << ",";
        out << "\"temperatureCelsius\":" << numOrNull(c.temperatureCelsius);
        out << "}";
    }
    out << "]}";

    out << ",\"ram\":{";
    out << "\"totalBytes\":" << s.ram.totalBytes << ",";
    out << "\"usedBytes\":" << s.ram.usedBytes << ",";
    out << "\"freeBytes\":" << s.ram.freeBytes << ",";
    out << "\"cachedBytes\":" << s.ram.cachedBytes << ",";
    out << "\"bufferedBytes\":" << s.ram.bufferedBytes << ",";
    out << "\"swapTotalBytes\":" << s.ram.swapTotalBytes << ",";
    out << "\"swapUsedBytes\":" << s.ram.swapUsedBytes << ",";
    out << "\"usagePercent\":" << numOrNull(s.ram.usagePercent);
    out << "}";

    auto writeDisks=[&]() {
        out << ",\"disks\":[";
        for (std::size_t i = 0; i < s.disks.size(); ++i) {
            if (i > 0) out << ",";
            const DiskMount& d = s.disks[i];
            out << "{";
            out << "\"mountpoint\":" << q(d.mountpoint) << ",";
            out << "\"filesystem\":" << q(d.filesystem) << ",";
            out << "\"totalBytes\":" << d.totalBytes << ",";
            out << "\"usedBytes\":" << d.usedBytes << ",";
            out << "\"freeBytes\":" << d.freeBytes << ",";
            out << "\"usagePercent\":" << numOrNull(d.usagePercent) << ",";
            out << "\"readBytesPerSecond\":" << numOrNull(d.readBytesPerSecond) << ",";
            out << "\"writeBytesPerSecond\":" << numOrNull(d.writeBytesPerSecond) << ",";
            out << "\"ioLatencyMs\":" << numOrNull(d.ioLatencyMs) << ",";
            out << "\"daysUntilFull\":" << numOrNull(d.daysUntilFull) << ",";
            out << "\"predictedUsage7d\":" << numOrNull(d.predictedUsage7d);
            out << "}";
        }
        out << "]";
    };
    writeDisks();

    auto writeNetwork=[&]() {
        out << ",\"network\":[";
        for (std::size_t i = 0; i < s.network.size(); ++i) {
            if (i > 0) out << ",";
            const NetworkInterface& n = s.network[i];
            out << "{";
            out << "\"name\":" << q(n.name) << ",";
            out << "\"rxBytesPerSecond\":" << numOrNull(n.rxBytesPerSecond) << ",";
            out << "\"txBytesPerSecond\":" << numOrNull(n.txBytesPerSecond) << ",";
            out << "\"rxPacketsPerSecond\":" << numOrNull(n.rxPacketsPerSecond) << ",";
            out << "\"txPacketsPerSecond\":" << numOrNull(n.txPacketsPerSecond) << ",";
            out << "\"rxErrors\":" << n.rxErrors << ",";
            out << "\"txErrors\":" << n.txErrors << ",";
            out << "\"monthlyRxBytes\":" << n.monthlyRxBytes << ",";
            out << "\"monthlyTxBytes\":" << n.monthlyTxBytes;
            out << "}";
        }
        out << "]";
    };
    writeNetwork();

    out << ",\"bandwidth\":[";
    for (std::size_t i = 0; i < s.bandwidth.size(); ++i) {
        if (i > 0) out << ",";
        const BandwidthPeriod& b = s.bandwidth[i];
        out << "{";
        out << "\"label\":" << q(b.label) << ",";
        out << "\"start\":" << b.start << ",";
        out << "\"end\":" << b.end << ",";
        out << "\"rxBytes\":" << b.rxBytes << ",";
        out << "\"txBytes\":" << b.txBytes << ",";
        out << "\"totalBytes\":" << b.totalBytes;
        out << "}";
    }
    out << "]";

    auto writeGpu=[&]() {
        out << ",\"gpu\":[";
        for (std::size_t i = 0; i < s.gpu.size(); ++i) {
            if (i > 0) out << ",";
            const GpuMetrics& g = s.gpu[i];
            out << "{";
            out << "\"vendor\":" << q(g.vendor) << ",";
            out << "\"model\":" << q(g.model) << ",";
            out << "\"usagePercent\":" << numOrNull(g.usagePercent) << ",";
            out << "\"memoryUsedBytes\":" << g.memoryUsedBytes << ",";
            out << "\"memoryTotalBytes\":" << g.memoryTotalBytes << ",";
            out << "\"temperatureCelsius\":" << numOrNull(g.temperatureCelsius) << ",";
            out << "\"powerWatts\":" << numOrNull(g.powerWatts);
            out << "}";
        }
        out << "]";
    };
    writeGpu();

    auto writeDocker=[&]() {
        out << ",\"docker\":[";
        for (std::size_t i = 0; i < s.docker.size(); ++i) {
            if (i > 0) out << ",";
            const DockerContainer& d = s.docker[i];
            out << "{";
            out << "\"id\":" << q(d.id) << ",";
            out << "\"name\":" << q(d.name) << ",";
            out << "\"image\":" << q(d.image) << ",";
            out << "\"state\":" << q(d.state) << ",";
            out << "\"status\":" << q(d.status) << ",";
            out << "\"cpuPercent\":" << numOrNull(d.cpuPercent) << ",";
            out << "\"memoryUsageBytes\":" << d.memoryUsageBytes << ",";
            out << "\"memoryLimitBytes\":" << d.memoryLimitBytes << ",";
            out << "\"uptimeSeconds\":" << d.uptimeSeconds;
            out << "}";
        }
        out << "]";
    };
    writeDocker();

    out << ",\"fd\":{";
    out << "\"open\":" << s.fd.open << ",";
    out << "\"limit\":" << s.fd.limit << ",";
    out << "\"usagePercent\":" << numOrNull(s.fd.usagePercent) << ",";
    out << "\"topConsumers\":[";
    for (std::size_t i = 0; i < s.fd.topConsumers.size(); ++i) {
        if (i > 0) out << ",";
        const FdConsumer& c = s.fd.topConsumers[i];
        out << "{\"pid\":" << c.pid << ",\"name\":" << q(c.name) << ",\"openCount\":" << c.openCount << "}";
    }
    out << "]}";

    auto writeDns=[&]() {
        out << ",\"dns\":[";
        for (std::size_t i = 0; i < s.dns.size(); ++i) {
            if (i > 0) out << ",";
            const DnsProbeResult& d = s.dns[i];
            out << "{";
            out << "\"host\":" << q(d.host) << ",";
            out << "\"recordType\":" << q(d.recordType) << ",";
            out << "\"latencyMs\":" << numOrNull(d.latencyMs) << ",";
            out << "\"success\":" << boolJson(d.success) << ",";
            out << "\"error\":" << (d.error.empty() ? "null" : q(d.error)) << ",";
            out << "\"checkedAt\":" << d.checkedAt;
            out << "}";
        }
        out << "]";
    };
    writeDns();

    out << ",\"healthchecks\":[";
    for (std::size_t i = 0; i < s.healthchecks.size(); ++i) {
        if (i > 0) out << ",";
        const HealthcheckResult& h = s.healthchecks[i];
        out << "{";
        out << "\"id\":" << q(h.id) << ",";
        out << "\"command\":" << q(h.command) << ",";
        out << "\"exitCode\":" << h.exitCode << ",";
        out << "\"durationMs\":" << h.durationMs << ",";
        out << "\"stdout\":" << q(h.stdoutText) << ",";
        out << "\"stderr\":" << q(h.stderrText) << ",";
        out << "\"status\":" << q(h.status) << ",";
        out << "\"checkedAt\":" << h.checkedAt;
        out << "}";
    }
    out << "]";

    out << ",\"processes\":[";
    for (std::size_t i = 0; i < s.processes.size(); ++i) {
        if (i > 0) out << ",";
        const ProcessInfo& p = s.processes[i];
        out << "{";
        out << "\"pid\":" << p.pid << ",";
        out << "\"name\":" << q(p.name) << ",";
        out << "\"cpuPercent\":" << numOrNull(p.cpuPercent) << ",";
        out << "\"memoryPercent\":" << numOrNull(p.memoryPercent) << ",";
        out << "\"rssBytes\":" << p.rssBytes << ",";
        out << "\"state\":" << q(p.state);
        out << "}";
    }
    out << "]";

    out << ",\"services\":[";
    for (std::size_t i = 0; i < s.services.size(); ++i) {
        if (i > 0) out << ",";
        const ServiceStatus& svc = s.services[i];
        out << "{";
        out << "\"name\":" << q(svc.name) << ",";
        out << "\"status\":" << q(svc.status) << ",";
        out << "\"since\":" << (svc.since > 0 ? std::to_string(svc.since) : "null") << ",";
        out << "\"message\":" << (svc.message.empty() ? "null" : q(svc.message));
        out << "}";
    }
    out << "]";

    out << ",\"openPorts\":[";
    for (std::size_t i = 0; i < s.openPorts.size(); ++i) {
        if (i > 0) out << ",";
        const OpenPort& p = s.openPorts[i];
        out << "{";
        out << "\"protocol\":" << q(p.protocol) << ",";
        out << "\"port\":" << p.port << ",";
        out << "\"address\":" << q(p.address) << ",";
        out << "\"processName\":" << (p.processName.empty() ? "null" : q(p.processName)) << ",";
        out << "\"pid\":" << (p.pid > 0 ? std::to_string(p.pid) : "null");
        out << "}";
    }
    out << "]";

    out << "}";
    return out.str();
}

std::string alertsToJson(const std::vector<AlertRow>& alerts) {
    std::ostringstream out;
    out << "[";
    for (std::size_t i = 0; i < alerts.size(); ++i) {
        if (i > 0) out << ",";
        const AlertRow& a = alerts[i];
        out << "{";
        out << "\"id\":" << q(std::to_string(a.id)) << ",";
        out << "\"timestamp\":" << a.timestamp << ",";
        out << "\"metric\":" << q(a.metric) << ",";
        out << "\"value\":" << numOrNull(a.value) << ",";
        out << "\"threshold\":" << numOrNull(a.threshold) << ",";
        out << "\"message\":" << q(a.message) << ",";
        out << "\"severity\":" << q(a.severity) << ",";
        out << "\"resolvedAt\":" << (a.resolved_at > 0 ? std::to_string(a.resolved_at) : "null") << ",";
        out << "\"acknowledged\":" << boolJson(a.acknowledged) << ",";
        out << "\"acknowledgedBy\":" << (a.acknowledged_by.empty() ? "null" : q(a.acknowledged_by)) << ",";
        out << "\"acknowledgedAt\":" << (a.acknowledged_at > 0 ? std::to_string(a.acknowledged_at) : "null") << ",";
        out << "\"suppressed\":" << boolJson(a.suppressed) << ",";
        out << "\"suppressedReason\":" << (a.suppressedReason.empty() ? "null" : q(a.suppressedReason)) << ",";
        out << "\"comments\":[";
        for (std::size_t c = 0; c < a.comments.size(); ++c) {
            if (c > 0) out << ",";
            const AlertComment& comment = a.comments[c];
            out << "{";
            out << "\"id\":" << q(comment.id) << ",";
            out << "\"text\":" << q(comment.text) << ",";
            out << "\"author\":" << q(comment.author) << ",";
            out << "\"createdAt\":" << comment.createdAt;
            out << "}";
        }
        out << "],";
        out << "\"isAnomaly\":" << boolJson(a.is_anomaly) << ",";
        out << "\"anomalySigma\":" << (a.is_anomaly ? numOrNull(a.anomaly_sigma) : "null");
        out << "}";
    }
    out << "]";
    return out.str();
}

std::string uptimeToJson(const UptimeStats& stats) {
    std::ostringstream out;
    out << "{";
    out << "\"period\":" << q(stats.period) << ",";
    out << "\"uptimePercent\":" << numOrNull(stats.uptimePercent) << ",";
    out << "\"expectedSeconds\":" << stats.expectedSeconds << ",";
    out << "\"uptimeSeconds\":" << stats.uptimeSeconds << ",";
    out << "\"gaps\":[";
    for (std::size_t i = 0; i < stats.gaps.size(); ++i) {
        if (i > 0) out << ",";
        out << "{\"start\":" << stats.gaps[i].start << ",\"end\":" << stats.gaps[i].end << "}";
    }
    out << "]}";
    return out.str();
}

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
) {
    std::ostringstream out;
    out << "{";
    out << "\"version\":" << q(version) << ",";
    out << "\"uptimeSeconds\":" << uptimeSeconds << ",";
    out << "\"dbSizeBytes\":" << dbSizeBytes << ",";
    out << "\"totalMetricRows\":" << totalMetricRows << ",";
    out << "\"retentionDays\":" << retentionDays << ",";
    out << "\"tlsEnabled\":" << boolJson(tlsEnabled) << ",";
    out << "\"anomalyEnabled\":" << boolJson(anomalyEnabled) << ",";
    out << "\"maintenanceActive\":" << boolJson(maintenanceActive) << ",";
    out << "\"cooldownsPersisted\":" << boolJson(cooldownsPersisted);
    out << "}";
    return out.str();
}
