import "server-only";

import {
  type AgentHealth,
  type AlertEvent,
  type Annotation,
  type AuditEntry,
  type BandwidthPeriod,
  type MaintenanceWindow,
  type ShareToken,
  type Silence,
  type Snapshot,
  type UptimeData,
  type ServerGroup,
} from "@/lib/types";
import type { HistoryPoint, LogLine } from "@/lib/api";

export function isMockMode(): boolean {
  return process.env.VPSMON_MOCK === "true";
}

export function seededNoise(serverId: string, base: number, range: number): number {
  const seed = serverId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return base + Math.sin(Date.now() / 10000 + seed) * range;
}

function seedFromText(value: string): number {
  return value.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

export function getMockSnapshot(serverId: string): Snapshot {
  const cpuUsage = seededNoise(serverId, 42, 18);
  const diskUsage = seededNoise(`${serverId}-disk`, 61, 9);
  return {
    timestamp: Date.now(),
    hostname: `${serverId}.example.internal`,
    uptimeSeconds: 86400 * 17,
    cpu: {
      usagePercent: cpuUsage,
      loadAverage1m: cpuUsage / 20,
      loadAverage5m: cpuUsage / 24,
      loadAverage15m: cpuUsage / 28,
      temperatureCelsius: seededNoise(serverId, 58, 6),
      cores: Array.from({ length: 4 }, (_, index) => ({
        id: index,
        label: `cpu${index}`,
        usagePercent: seededNoise(`${serverId}-${index}`, 40 + index * 4, 12),
        temperatureCelsius: seededNoise(`${serverId}-temp-${index}`, 57, 5),
      })),
    },
    ram: {
      totalBytes: 16 * 1024 ** 3,
      usedBytes: 9.2 * 1024 ** 3,
      freeBytes: 3.1 * 1024 ** 3,
      cachedBytes: 2.5 * 1024 ** 3,
      bufferedBytes: 0.8 * 1024 ** 3,
      swapTotalBytes: 2 * 1024 ** 3,
      swapUsedBytes: 0.2 * 1024 ** 3,
      usagePercent: seededNoise(`${serverId}-ram`, 57, 8),
    },
    disks: [{
      mountpoint: "/data", filesystem: "ext4", totalBytes: 500 * 1024 ** 3, usedBytes: 320 * 1024 ** 3, freeBytes: 180 * 1024 ** 3, usagePercent: diskUsage, readBytesPerSecond: 1024 * 1024 * 22, writeBytesPerSecond: 1024 * 1024 * 14, ioLatencyMs: seededNoise(`${serverId}-lat`, 3.1, 1.2), daysUntilFull: 41, predictedUsage7d: Math.min(100, diskUsage + 2.4) }],
    network: [{ name: "eth0", rxBytesPerSecond: 1024 * 320, txBytesPerSecond: 1024 * 210, rxPacketsPerSecond: 750, txPacketsPerSecond: 640, rxErrors: 0, txErrors: 0, monthlyRxBytes: 250 * 1024 ** 3, monthlyTxBytes: 180 * 1024 ** 3 }],
    bandwidth: [getMockBandwidth("day")],
    gpu: [{ vendor: "nvidia", model: "T4", usagePercent: seededNoise(`${serverId}-gpu`, 34, 10), memoryUsedBytes: 2 * 1024 ** 3, memoryTotalBytes: 16 * 1024 ** 3, temperatureCelsius: seededNoise(`${serverId}-gpu-temp`, 63, 4), powerWatts: seededNoise(`${serverId}-gpu-power`, 57, 7) }],
    docker: [{ id: `ctr-${serverId}`, name: "api", image: "ghcr.io/example/api:latest", state: "running", status: "Up 3 days", cpuPercent: seededNoise(`${serverId}-docker`, 11, 5), memoryUsageBytes: 512 * 1024 ** 2, memoryLimitBytes: 2 * 1024 ** 3, uptimeSeconds: 86400 * 3 }],
    fd: { open: 912, limit: 4096, usagePercent: 22.2, topConsumers: [{ pid: 1234, name: "node", openCount: 210 }] },
    dns: [{ host: "api.example.com", recordType: "A", latencyMs: seededNoise(`${serverId}-dns`, 22, 6), success: true, error: null, checkedAt: Date.now() }],
    healthchecks: [{ id: "health-main", command: "curl -f http://localhost:3000/health", exitCode: 0, durationMs: 142, stdout: "ok", stderr: "", status: "passing", checkedAt: Date.now() }],
    processes: [{ pid: 1821, name: "node", cpuPercent: 7.1, memoryPercent: 4.8, rssBytes: 325 * 1024 ** 2, state: "S" }],
    services: [{ name: "nginx", status: "active", since: Date.now() - 7200000, message: null }],
    openPorts: [{ protocol: "tcp", port: 443, address: "0.0.0.0", processName: "nginx", pid: 812 }],
  };
}

export function getMockHistory(metric: string, duration: number, maxPoints: number = 300): HistoryPoint[] {
  const now = Date.now();
  const seed = seedFromText(metric);
  const step = Math.max(1000, Math.floor((duration * 1000) / maxPoints));
  return Array.from({ length: maxPoints }, (_, index) => ({
    timestamp: now - (maxPoints - index) * step,
    value: 50 + Math.sin(index / 8 + seed) * 18,
  }));
}

export function getMockAlerts(): AlertEvent[] {
  return [{ id: "alert-1", timestamp: Date.now() - 600000, metric: "disk /data", value: 88, threshold: 85, message: "Disk usage exceeded warning threshold", severity: "warning", resolvedAt: null, acknowledged: false, acknowledgedBy: null, acknowledgedAt: null, suppressed: true, suppressedReason: "silence", comments: [], isAnomaly: false, anomalySigma: null }, { id: "alert-2", timestamp: Date.now() - 3600000, metric: "cpu", value: 97, threshold: 90, message: "CPU spike detected", severity: "critical", resolvedAt: Date.now() - 3000000, acknowledged: true, acknowledgedBy: "ops@example.com", acknowledgedAt: Date.now() - 3500000, suppressed: false, suppressedReason: null, comments: [], isAnomaly: true, anomalySigma: 3.4 }];
}

export function getMockAgentHealth(): AgentHealth {
  return { version: "0.1.0", uptimeSeconds: 86400 * 14, dbSizeBytes: 4 * 1024 ** 2, totalMetricRows: 12816, retentionDays: 30, tlsEnabled: true, anomalyEnabled: true, maintenanceActive: false, cooldownsPersisted: true };
}

export function getMockBandwidth(period: "day" | "week" | "month"): BandwidthPeriod {
  const now = Date.now();
  const duration = period === "day" ? 86400000 : period === "week" ? 604800000 : 2592000000;
  return { label: period, start: now - duration, end: now, rxBytes: 64 * 1024 ** 3, txBytes: 28 * 1024 ** 3, totalBytes: 92 * 1024 ** 3 };
}

export function getMockAnnotations(serverId: string): Annotation[] {
  return [{ id: `ann-${serverId}-1`, serverId, title: "Deploy completed", description: "Rolled out v1.2.3", createdBy: "ci", createdAt: Date.now() - 7200000, timestamp: Date.now() - 7200000 }, { id: `ann-${serverId}-2`, serverId, title: "Kernel upgrade", description: "Scheduled maintenance reboot", createdBy: "ops", createdAt: Date.now() - 86400000, timestamp: Date.now() - 86400000 }];
}

export function getMockUptimeData(period: "day" | "week" | "month"): UptimeData {
  const duration = period === "day" ? 86400 : period === "week" ? 604800 : 2592000;
  return { period, uptimePercent: 99.7, expectedSeconds: duration, uptimeSeconds: duration * 0.997, gaps: [{ start: Date.now() - 3600000, end: Date.now() - 1800000 }] };
}

export function getMockLogs(): { lines: LogLine[] } {
  return { lines: Array.from({ length: 20 }, (_, index) => ({ timestamp: Date.now() - index * 60000, level: index % 5 === 0 ? "WARN" : "INFO", message: index % 5 === 0 ? "Transient latency spike detected" : `Heartbeat ok (${20 - index})` })) };
}

export function getMockGroups(): ServerGroup[] {
  return [{ id: "grp-prod", name: "Production", color: "#6366f1", serverIds: ["prod-a", "prod-b"], description: "Primary production cluster", createdAt: Date.now() - 86400000 }, { id: "grp-edge", name: "Edge", color: "#22c55e", serverIds: ["edge-1"], description: "Edge nodes", createdAt: Date.now() - 43200000 }];
}

export function getMockMaintenanceWindows(serverId: string): MaintenanceWindow[] {
  return [{ id: `mw-${serverId}`, serverId, label: "Weekly patching", schedule: "cron:0 2 * * 0", durationMinutes: 60, enabled: true, createdBy: "ops", createdAt: Date.now() - 86400000 }];
}

export function getMockSilences(serverId: string): Silence[] {
  return [{ id: `sil-${serverId}`, serverId, metric: "disk /data", reason: "Known capacity expansion scheduled", createdBy: "ops", createdAt: Date.now() - 600000, expiresAt: Date.now() + 86400000 }];
}

export function getMockShareTokens(serverId: string): ShareToken[] {
  return [{ id: `share-${serverId}`, serverId, token: `token-${seedFromText(serverId)}`, label: "Customer status page", createdBy: "ops", createdAt: Date.now() - 300000, expiresAt: Date.now() + 604800000 }];
}
