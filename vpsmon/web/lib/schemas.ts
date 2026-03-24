import { z } from "zod";

export const TimestampSchema = z.number();

export const CpuCoreSchema = z.object({
  id: z.number(),
  label: z.string(),
  usagePercent: z.number(),
  temperatureCelsius: z.number().nullable(),
});

export const CpuMetricsSchema = z.object({
  usagePercent: z.number(),
  loadAverage1m: z.number(),
  loadAverage5m: z.number(),
  loadAverage15m: z.number(),
  temperatureCelsius: z.number().nullable(),
  cores: z.array(CpuCoreSchema),
});

export const RamMetricsSchema = z.object({
  totalBytes: z.number(),
  usedBytes: z.number(),
  freeBytes: z.number(),
  cachedBytes: z.number(),
  bufferedBytes: z.number(),
  swapTotalBytes: z.number(),
  swapUsedBytes: z.number(),
  usagePercent: z.number(),
});

export const DiskMountSchema = z.object({
  mountpoint: z.string(),
  filesystem: z.string(),
  totalBytes: z.number(),
  usedBytes: z.number(),
  freeBytes: z.number(),
  usagePercent: z.number(),
  readBytesPerSecond: z.number(),
  writeBytesPerSecond: z.number(),
  ioLatencyMs: z.number(),
  daysUntilFull: z.number().nullable(),
  predictedUsage7d: z.number().nullable(),
});

export const NetworkInterfaceSchema = z.object({
  name: z.string(),
  rxBytesPerSecond: z.number(),
  txBytesPerSecond: z.number(),
  rxPacketsPerSecond: z.number(),
  txPacketsPerSecond: z.number(),
  rxErrors: z.number(),
  txErrors: z.number(),
  monthlyRxBytes: z.number(),
  monthlyTxBytes: z.number(),
});

export const BandwidthPeriodSchema = z.object({
  label: z.string(),
  start: TimestampSchema,
  end: TimestampSchema,
  rxBytes: z.number(),
  txBytes: z.number(),
  totalBytes: z.number(),
});

export const GpuMetricsSchema = z.object({
  vendor: z.enum(["nvidia", "amd", "intel", "unknown"]),
  model: z.string(),
  usagePercent: z.number(),
  memoryUsedBytes: z.number(),
  memoryTotalBytes: z.number(),
  temperatureCelsius: z.number().nullable(),
  powerWatts: z.number().nullable(),
});

export const DockerContainerSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string(),
  state: z.string(),
  status: z.string(),
  cpuPercent: z.number(),
  memoryUsageBytes: z.number(),
  memoryLimitBytes: z.number(),
  uptimeSeconds: z.number(),
});

export const FdMetricsSchema = z.object({
  open: z.number(),
  limit: z.number(),
  usagePercent: z.number(),
  topConsumers: z.array(
    z.object({
      pid: z.number(),
      name: z.string(),
      openCount: z.number(),
    }),
  ),
});

export const DnsProbeResultSchema = z.object({
  host: z.string(),
  recordType: z.string(),
  latencyMs: z.number().nullable(),
  success: z.boolean(),
  error: z.string().nullable(),
  checkedAt: TimestampSchema,
});

export const HealthcheckResultSchema = z.object({
  id: z.string(),
  command: z.string(),
  exitCode: z.number(),
  durationMs: z.number(),
  stdout: z.string(),
  stderr: z.string(),
  status: z.enum(["passing", "failing"]),
  checkedAt: TimestampSchema,
});

export const ProcessSchema = z.object({
  pid: z.number(),
  name: z.string(),
  cpuPercent: z.number(),
  memoryPercent: z.number(),
  rssBytes: z.number(),
  state: z.string(),
});

export const ServiceStatusSchema = z.object({
  name: z.string(),
  status: z.enum(["active", "failed", "stopped", "inactive", "unknown"]),
  since: TimestampSchema.nullable(),
  message: z.string().nullable(),
});

export const OpenPortSchema = z.object({
  protocol: z.enum(["tcp", "udp"]),
  port: z.number(),
  address: z.string(),
  processName: z.string().nullable(),
  pid: z.number().nullable(),
});

export const SnapshotSchema = z.object({
  timestamp: TimestampSchema,
  hostname: z.string(),
  uptimeSeconds: z.number(),
  cpu: CpuMetricsSchema,
  ram: RamMetricsSchema,
  disks: z.array(DiskMountSchema),
  network: z.array(NetworkInterfaceSchema),
  bandwidth: z.array(BandwidthPeriodSchema),
  gpu: z.array(GpuMetricsSchema),
  docker: z.array(DockerContainerSchema),
  fd: FdMetricsSchema,
  dns: z.array(DnsProbeResultSchema),
  healthchecks: z.array(HealthcheckResultSchema),
  processes: z.array(ProcessSchema),
  services: z.array(ServiceStatusSchema),
  openPorts: z.array(OpenPortSchema),
});

export const AlertCommentSchema = z.object({
  id: z.string(),
  text: z.string(),
  author: z.string(),
  createdAt: TimestampSchema,
});

export const AlertEventSchema = z.object({
  id: z.string(),
  timestamp: TimestampSchema,
  metric: z.string(),
  value: z.number(),
  threshold: z.number(),
  message: z.string(),
  severity: z.enum(["warning", "critical"]),
  resolvedAt: z.number().nullable(),
  acknowledged: z.boolean(),
  acknowledgedBy: z.string().nullable(),
  acknowledgedAt: z.number().nullable(),
  suppressed: z.boolean(),
  suppressedReason: z.enum(["maintenance", "silence"]).nullable(),
  comments: z.array(AlertCommentSchema),
  isAnomaly: z.boolean(),
  anomalySigma: z.number().nullable(),
});

export const AgentHealthSchema = z.object({
  version: z.string(),
  uptimeSeconds: z.number(),
  dbSizeBytes: z.number(),
  totalMetricRows: z.number(),
  retentionDays: z.number(),
  tlsEnabled: z.boolean(),
  anomalyEnabled: z.boolean(),
  maintenanceActive: z.boolean(),
  cooldownsPersisted: z.boolean(),
});

export const StoredKeySchema = z.object({
  id: z.string(),
  label: z.string(),
  keyHash: z.string(),
  role: z.string(),
  createdAt: TimestampSchema,
  expiresAt: z.number().nullable(),
  lastUsedAt: z.number().nullable(),
});

export const MaintenanceWindowSchema = z.object({
  id: z.string(),
  serverId: z.string(),
  label: z.string(),
  schedule: z.string(),
  durationMinutes: z.number(),
  enabled: z.boolean(),
  createdBy: z.string(),
  createdAt: TimestampSchema,
});

export const ServerGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  serverIds: z.array(z.string()),
  description: z.string().optional(),
  createdAt: TimestampSchema,
});

export const CustomWidgetSchema = z.object({
  id: z.string(),
  serverId: z.string(),
  title: z.string(),
  expression: z.string(),
  unit: z.string(),
  thresholdWarn: z.number(),
  thresholdCrit: z.number(),
  color: z.string(),
});

export const UptimeGapSchema = z.object({
  start: TimestampSchema,
  end: TimestampSchema,
});

export const UptimeDataSchema = z.object({
  period: z.string(),
  uptimePercent: z.number(),
  expectedSeconds: z.number(),
  uptimeSeconds: z.number(),
  gaps: z.array(UptimeGapSchema),
});

export const AuditEntrySchema = z.object({
  id: z.string(),
  timestamp: TimestampSchema,
  ip: z.string(),
  keyId: z.string().optional(),
  keyLabel: z.string().optional(),
  role: z.string().optional(),
  success: z.boolean(),
  userAgent: z.string(),
});

export const SilenceSchema = z.object({
  id: z.string(),
  serverId: z.string(),
  metric: z.string(),
  reason: z.string(),
  createdBy: z.string(),
  createdAt: TimestampSchema,
  expiresAt: z.number().nullable(),
});

export const ShareTokenSchema = z.object({
  id: z.string(),
  serverId: z.string(),
  token: z.string(),
  label: z.string(),
  createdBy: z.string(),
  createdAt: TimestampSchema,
  expiresAt: z.number().nullable(),
});

export const ReportSectionSchema = z.enum([
  "cover",
  "summary",
  "cpu",
  "ram",
  "disk",
  "network",
  "uptime",
  "alerts",
  "healthchecks",
]);

export const ReportOptionsSchema = z.object({
  sections: z.array(ReportSectionSchema),
  companyName: z.string().optional(),
  logoBase64: z.string().optional(),
  periodLabel: z.string().optional(),
});

export type CpuCore = z.infer<typeof CpuCoreSchema>;
export type CpuMetrics = z.infer<typeof CpuMetricsSchema>;
export type RamMetrics = z.infer<typeof RamMetricsSchema>;
export type DiskMount = z.infer<typeof DiskMountSchema>;
export type NetworkInterface = z.infer<typeof NetworkInterfaceSchema>;
export type BandwidthPeriod = z.infer<typeof BandwidthPeriodSchema>;
export type GpuMetrics = z.infer<typeof GpuMetricsSchema>;
export type DockerContainer = z.infer<typeof DockerContainerSchema>;
export type FdMetrics = z.infer<typeof FdMetricsSchema>;
export type DnsProbeResult = z.infer<typeof DnsProbeResultSchema>;
export type HealthcheckResult = z.infer<typeof HealthcheckResultSchema>;
export type Process = z.infer<typeof ProcessSchema>;
export type ServiceStatus = z.infer<typeof ServiceStatusSchema>;
export type OpenPort = z.infer<typeof OpenPortSchema>;
export type Snapshot = z.infer<typeof SnapshotSchema>;
export type AlertComment = z.infer<typeof AlertCommentSchema>;
export type AlertEvent = z.infer<typeof AlertEventSchema>;
export type AgentHealth = z.infer<typeof AgentHealthSchema>;
export type StoredKey = z.infer<typeof StoredKeySchema>;
export type MaintenanceWindow = z.infer<typeof MaintenanceWindowSchema>;
export type ServerGroup = z.infer<typeof ServerGroupSchema>;
export type CustomWidget = z.infer<typeof CustomWidgetSchema>;
export type UptimeGap = z.infer<typeof UptimeGapSchema>;
export type UptimeData = z.infer<typeof UptimeDataSchema>;
export type AuditEntry = z.infer<typeof AuditEntrySchema>;
export type Silence = z.infer<typeof SilenceSchema>;
export type ShareToken = z.infer<typeof ShareTokenSchema>;
export type ReportSection = z.infer<typeof ReportSectionSchema>;
export type ReportOptions = z.infer<typeof ReportOptionsSchema>;
