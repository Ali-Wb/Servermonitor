# VPS Health Dashboard — Full Build Plan

> **How to use:** Copy each task block and paste into Codex. Always attach `CONTEXT.md`. Tasks are in strict dependency order — do not skip ahead.

---

## PHASE 1 — Project Scaffolding

---

### TASK 1.1 — Initialize Monorepo Structure

```
Create directory tree (empty folders with .gitkeep):
vpsmon/
├── agent/
│   ├── src/collectors/ src/storage/ src/server/ src/alerts/channels/ src/config/ src/util/
│   ├── tui/
│   ├── include/ (mirror of src/ structure)
│   ├── vendor/sqlite3/ scripts/ tests/
├── web/
├── scripts/
└── README.md

Root .gitignore:
  *.o *.a build/ *.d
  node_modules/ .next/ .env.local .env.*.local
  *.db *.db-wal *.db-shm *.corrupt.*
  .vscode/ .idea/ *.swp .sentryclirc .DS_Store Thumbs.db
  keys.json thresholds.json annotations.json groups.json maintenance.json
  alert_comments.json audit.json widgets.json uptime.json silences.json shares.json

Create root README.md (one paragraph placeholder) and CHANGELOG.md.
```

---

### TASK 1.2 — Initialize Next.js 16 Frontend

```
Inside vpsmon/web/:

npx create-next-app@latest . --typescript --eslint --tailwind --app --no-src-dir --import-alias "@/*"
npm install next@latest react@latest react-dom@latest

Install ALL dependencies:
npm install @tanstack/react-query @tanstack/react-query-devtools recharts lucide-react clsx \
  @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @sentry/nextjs next-themes \
  zod zod-to-json-schema bcryptjs @react-pdf/renderer cronstrue

npm install -D @types/bcryptjs

IMPORTANT: Tailwind v4 — NO tailwind.config.ts. Delete if generated.

npx shadcn@latest init (Tailwind v4, dark mode class, CSS variables yes)

Create lib/utils.ts:
  import { clsx, type ClassValue } from "clsx"
  export function cn(...inputs: ClassValue[]) { return clsx(inputs) }
```

---

### TASK 1.3 — Install shadcn/ui Components

```
npx shadcn@latest add card badge tooltip table dialog separator skeleton progress \
  scroll-area tabs field item empty spinner kbd input-group button sheet toast drawer \
  popover select radio-group switch alert-dialog

All install as owned code in components/ui/. Verify all imports resolve.
```

---

### TASK 1.4 — Configure Tailwind v4 and Global Styles

```
IMPORTANT: Tailwind v4 — NO tailwind.config.ts. ALL config in CSS only.

Update app/globals.css:

@import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap");
@import "tailwindcss";

@theme {
  --color-background: #0a0a0f;
  --color-background-light: #f8fafc;
  --color-foreground: #e2e8f0;
  --color-foreground-light: #0f172a;
  --color-card: #111118;
  --color-card-light: #ffffff;
  --color-card-foreground: #e2e8f0;
  --color-border: #1e1e2e;
  --color-border-light: #e2e8f0;
  --color-muted: #1e1e2e;
  --color-muted-foreground: #64748b;
  --color-primary: #6366f1;
  --color-primary-foreground: #ffffff;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-destructive: #ef4444;
  --color-maintenance: #a855f7;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}

@layer base {
  html { color-scheme: dark; }
  html.light { color-scheme: light; }
  body { background-color: var(--color-background); color: var(--color-foreground); }
  .light body { background-color: var(--color-background-light); color: var(--color-foreground-light); }
}

@keyframes fadeInUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
@keyframes pulse-dot { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
@keyframes marquee { from { transform:translateX(100%); } to { transform:translateX(-100%); } }

app/layout.tsx: ThemeProvider (outer) → IntervalsProvider → QueryProvider (inner).
Default className="dark" on html. metadata: title="VPS Monitor".
```

---

### TASK 1.5 — Create Zod Schemas (Single Source of Truth)

```
Create vpsmon/web/lib/schemas.ts

ALL shapes defined as Zod schemas. Types via z.infer<>. NO manually written interfaces.

Core metric schemas (as before): CpuCore, CpuMetrics, RamMetrics,
  DiskMount (includes daysUntilFull, predictedUsage7d),
  NetworkInterface, BandwidthPeriod, GpuMetrics, DockerContainer,
  FdMetrics, DnsProbeResult, HealthcheckResult, Process, ServiceStatus, OpenPort.

SnapshotSchema: all above + gpu, docker, fd, dns, healthchecks.

AlertCommentSchema = z.object({ id, text, author, createdAt })

AlertEventSchema includes ALL fields:
  id, timestamp, metric, value, threshold, message,
  severity: z.enum(['warning','critical']),
  resolvedAt: z.number().nullable(),
  acknowledged: z.boolean(),
  acknowledgedBy: z.string().nullable(),
  acknowledgedAt: z.number().nullable(),
  suppressed: z.boolean(),
  suppressedReason: z.enum(['maintenance','silence']).nullable(),
  comments: z.array(AlertCommentSchema),
  isAnomaly: z.boolean(),
  anomalySigma: z.number().nullable(),

AgentHealthSchema includes: version, uptimeSeconds, dbSizeBytes, totalMetricRows,
  retentionDays, tlsEnabled, anomalyEnabled, maintenanceActive, cooldownsPersisted: z.boolean()

StoredKeySchema includes expiresAt: z.number().nullable()

MaintenanceWindowSchema: id, serverId, label, schedule, durationMinutes, enabled, createdBy, createdAt

ServerGroupSchema: id, name, color, serverIds, description?, createdAt

CustomWidgetSchema: id, serverId, title, expression, unit, thresholdWarn, thresholdCrit, color

UptimeDataSchema: period, uptimePercent, expectedSeconds, uptimeSeconds,
  gaps: array of {start, end}

AuditEntrySchema: id, timestamp, ip (may be anonymized), keyId?, keyLabel?, role?, success, userAgent

SilenceSchema = z.object({
  id, serverId, metric, reason,
  createdBy, createdAt, expiresAt: z.number().nullable()
})

ShareTokenSchema = z.object({
  id, serverId, token, label,
  createdBy, createdAt, expiresAt: z.number().nullable()
})

ReportOptionsSchema = z.object({
  sections: z.array(z.enum(['cover','summary','cpu','ram','disk','network','uptime','alerts','healthchecks'])),
  companyName: z.string().optional(),
  logoBase64: z.string().optional(),
  periodLabel: z.string().optional(),
})

Export all z.infer<> types at bottom.
```

---

### TASK 1.6 — lib/types.ts and lib/api-types.ts

```
lib/types.ts: re-exports all types from schemas.ts. No definitions here.
lib/api-types.ts: export interface AgentResponse<T> { ok: boolean; ts: number; data: T; error?: string; }
```

---

### TASK 1.7 — Agent API Client

```
Create vpsmon/web/lib/api.ts

Auth header handling, 401/403/429 errors, typed functions.

All fetch functions:
  fetchSnapshot(serverId)
  fetchHistory(serverId, metric, duration, maxPoints=300)
    → GET /api/servers/[id]/history?metric=...&duration=...&maxPoints=300
  fetchAlerts(serverId)
  acknowledgeAlert(serverId, alertId)
  fetchAlertComments(serverId, alertId)
  addAlertComment(serverId, alertId, text)
  fetchPing(serverId)
  fetchAgentHealth(serverId)
  fetchBandwidth(serverId, period)
  exportMetrics(serverId, format, range?, sections?, companyName?, logoBase64?)
  fetchServers()
  fetchAnnotations(serverId)
  createAnnotation(serverId, data)
  deleteAnnotation(serverId, annotationId)
  sendTestAlert(serverId)
  fetchUptimeData(serverId, period)
  fetchLogs(serverId, lines)
  fetchGroups()
  createGroup(data), updateGroup(groupId, data), deleteGroup(groupId)
  fetchMaintenanceWindows(serverId?)
  createMaintenanceWindow(data), updateMaintenanceWindow(id, data), deleteMaintenanceWindow(id)
  fetchWidgets(serverId)
  createWidget(data), deleteWidget(id)
  triggerSelfUpdate(serverId)
  fetchSilences(serverId)
  createSilence(serverId, data), deleteSilence(serverId, silenceId)
  fetchShareTokens(serverId)
  createShareToken(serverId, data), deleteShareToken(serverId, tokenId)
  fetchAuditLog()
```

---

### TASK 1.8 — TanStack Query Provider, IntervalsProvider, and Hooks

```
Create vpsmon/web/providers/IntervalsProvider.tsx ('use client'):

CRITICAL SSR SAFETY: Reading localStorage must be guarded:
  function safeGetIntervals(): Record<string, number> {
    if (typeof window === 'undefined') return {}   // SSR: use defaults
    try {
      const raw = localStorage.getItem('vpsmon-intervals')
      return raw ? JSON.parse(raw) : {}
    } catch { return {} }
  }

Context provides: getInterval(panelId, defaultMs), setInterval(panelId, ms)
setInterval: updates state AND localStorage atomically.
Default intervals from CONTEXT.md table (cpu:1000, services:10000, etc.)

Create vpsmon/web/providers/QueryProvider.tsx ('use client'):
  Standard QueryClientProvider + ReactQueryDevtools.
  defaultOptions: { queries: { staleTime:0, retry:2, refetchOnWindowFocus:false } }

Create vpsmon/web/hooks/useMetrics.ts:
  CRITICAL: TanStack Query v5 — `isPending` NOT `isLoading`.
  All hooks read intervalMs via getInterval() from IntervalsProvider context.

  useSnapshot(serverId): isPending, isError, isStale, lastUpdated, refetch
  useHistory(serverId, metric, durationSeconds)
    - always passes maxPoints:300 to API
  useAlerts(serverId)
  useAgentHealth(serverId)
  useBandwidth(serverId, period)
  useAnnotations(serverId)
  useUptimeData(serverId, period)
  useLogs(serverId, lines, autoRefresh)
  useLatencyHistory(serverId): stores last 60 RTTs in useRef array
  useMaintenance(serverId?)
  useGroups()
  useWidgets(serverId)
  useSilences(serverId)
  useShareTokens(serverId)
```

---

### TASK 1.9 — Theme Provider and Hook

```
providers/ThemeProvider.tsx ('use client'):
  NextThemesProvider: attribute="class", defaultTheme="dark", enableSystem, storageKey="vpsmon-theme"

hooks/useTheme.ts ('use client'):
  Wraps next-themes. Exports: { theme, resolvedTheme, setTheme, cycleTheme }
  cycleTheme: dark→light→system→dark
```

---

### TASK 1.10 — Authentication, Key Store, Audit Log, and Login Page

```
Create vpsmon/web/lib/auth.ts:

ATOMIC WRITE RULE: All file writes use atomicWrite(path, data):
  const tmp = path + '.tmp.' + process.pid + '.' + Date.now()
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8')
  await fs.rename(tmp, path)

SAFE FILE-NOT-FOUND RULE: getKeyStore() handles deleted keys.json:
  try { read file }
  catch (err) {
    if (err.code === 'ENOENT') {
      console.warn('[auth] keys.json deleted — auth disabled until restored')
      return []
    }
    throw err
  }

StoredKey includes expiresAt: number | null.

verifyApiKey(key, ip, userAgent): Promise<'admin'|'readonly'|null>
  - If key has expiresAt and now > expiresAt: log failed audit entry, return null
  - bcrypt.compare each hash; on match: update lastUsed, log success audit entry

createKey(label, role, expiresAt?): Promise<{id, plaintext}>
revokeKey(id): Promise<void>
isAuthEnabled(): boolean (synchronous, checks file existence OR VPSMON_API_KEYS)

verifyApiKeyCached(key): 'admin'|'readonly'|null
  - 5s in-memory cache with safe file-not-found handling:
    on cache miss or expired: try to reload; if ENOENT: return 'admin' (auth disabled)
  - bcrypt.compareSync for sync path

Audit log (lib/audit.ts):
  VPSMON_AUDIT_PATH (default: './audit.json')
  VPSMON_AUDIT_RETENTION_DAYS (default: 90)
  VPSMON_AUDIT_ANONYMIZE_IPS (default: 'true')
    - IPv4: replace last octet with .0
    - IPv6: replace last 64 bits with ::
  VPSMON_AUDIT_ENABLED (default: 'true')

  logAuthAttempt(entry): Promise<void>
    - If VPSMON_AUDIT_ENABLED=false: return immediately
    - Anonymize IP if VPSMON_AUDIT_ANONYMIZE_IPS=true
    - Read existing (or []), prepend new, trim to VPSMON_AUDIT_RETENTION_DAYS days
      (filter by timestamp >= now - retentionDays * 86400 * 1000)
    - atomicWrite
  getAuditLog(limit=100): Promise<AuditEntry[]>

Login page, /api/auth/verify, /api/auth/keys, /api/auth/keys/[keyId], /api/auth/audit as before.
```

---

### TASK 1.11 — Mock Agent Module (Deterministic Per-Server)

```
Create vpsmon/web/lib/mock.ts (server-side only)

CRITICAL: All mock data seeded by serverId:
  function seededNoise(serverId, base, range) {
    const seed = serverId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    return base + Math.sin(Date.now() / 10000 + seed) * range
  }

Different serverIds produce meaningfully different metric values.

getMockSnapshot(serverId): full Snapshot with all fields seeded by serverId
getMockHistory(metric, duration, maxPoints=300): HistoryData
  - Returns exactly maxPoints data points (sine wave, seeded by metric name)
getMockAlerts(): AlertEvent[] with resolvedAt, acknowledged, isAnomaly, suppressedReason fields
getMockAgentHealth(): AgentHealth with cooldownsPersisted:true
getMockBandwidth(period): BandwidthPeriod
getMockAnnotations(serverId): 2 annotations
getMockUptimeData(period): 99.7% uptime, 1 gap
getMockLogs(): 20 realistic log lines
getMockGroups(): 2 groups
getMockMaintenanceWindows(serverId): 1 recurring window
getMockSilences(serverId): 1 silence for disk /data
getMockShareTokens(serverId): 1 share token

export function isMockMode(): boolean
```

---

### TASK 1.12 — All Backend Helper Modules

```
Create vpsmon/web/lib/annotations.ts (VPSMON_ANNOTATIONS_PATH, atomicWrite, CRUD)
Create vpsmon/web/lib/comments.ts (VPSMON_COMMENTS_PATH, atomicWrite, CRUD)
Create vpsmon/web/lib/groups.ts (VPSMON_GROUPS_PATH, atomicWrite, CRUD)
Create vpsmon/web/lib/widgets.ts (VPSMON_WIDGETS_PATH, atomicWrite, CRUD)
Create vpsmon/web/lib/thresholds.ts (VPSMON_THRESHOLDS_PATH, atomicWrite, get/set)

Create vpsmon/web/lib/maintenance.ts:
  VPSMON_MAINTENANCE_PATH, atomicWrite, CRUD.
  isInMaintenanceWindow(serverId, now?): boolean
    - Evaluates each enabled window's schedule
    - Cron evaluator: supports *, exact value, */step, range (start-end), list (a,b,c)
    - Does NOT support L, #, or named months/days — log warning and return false if used
    - "once:<ms>": active if now is within [ts, ts + durationMinutes * 60000]
    - Returns false on any parse error (conservative)
  parseCronExpression(expr: string): { valid: boolean; error?: string }
    - Validates the expression BEFORE saving — used by settings UI

Create vpsmon/web/lib/silences.ts:
  VPSMON_SILENCES_PATH (default: './silences.json')
  getSilences(serverId?): Silence[]
  createSilence(serverId, data): Silence
  deleteSilence(id): void
  isMetricSilenced(serverId, metric, now?): { silenced: boolean; reason?: string }
    - Check expiresAt — if expired, treat as not silenced
  atomicWrite for all writes.

Create vpsmon/web/lib/share.ts:
  VPSMON_SHARES_PATH (default: './shares.json')
  getShareTokens(serverId?): ShareToken[]
  createShareToken(serverId, data): ShareToken
    - token = crypto.randomBytes(32).toString('base64url')
  deleteShareToken(id): void
  verifyShareToken(token): ShareToken | null
    - Check expiresAt — return null if expired
  atomicWrite for all writes.
```

---

## PHASE 2 — Agent: Core Infrastructure (C++)

---

### TASK 2.1 — Agent: Makefile

```
Main binary: vpsmon-agent
TUI binary: vpsmon-tui (tui target, -lncurses)
TUI-TLS binary: vpsmon-tui-tls (tui-tls target, -lncurses -lssl -lcrypto -DVPSMON_TLS=1)

Targets: all, tui, tui-tls, clean, install, install-tui, test
Flags: g++ -std=c++17 -Wall -Wextra -O2
TLS=1: -lssl -lcrypto -DVPSMON_TLS=1
sqlite3.c compiled with gcc (C not C++).
Link: -lpthread -ldl
.d dependency files. Colored ✓ on success.
```

---

### TASK 2.2 — Agent: SQLite Wrapper

```
include/storage/sqlite.hpp and src/storage/sqlite.cpp

Database class: exec (plain + parameterized), query (plain + parameterized),
  beginTransaction, commit, rollback, integrityCheck().

On open: PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA synchronous=NORMAL;
integrityCheck(): PRAGMA integrity_check → return result[0]["integrity_check"] == "ok"
Throw std::runtime_error on all failures.
```

---

### TASK 2.3 — Agent: Config Parser

```
include/config/config.hpp and src/config/config.cpp

AgentConfig includes ALL fields from CONTEXT.md Full Config File Reference including:
  int startup_warmup_s = 5
  std::vector<std::string> allowed_ips
  bool tui_auth_enabled = false
  bool anomaly_enabled = true
  float anomaly_threshold_sigma = 3.0f
  int anomaly_min_datapoints = 14
  std::string maintenance_check_url    // NEW: URL to poll for maintenance status
  std::vector<std::string> config_watch_files
  bool config_watch_enabled = false
  bool uptime_enabled = true
  int uptime_heartbeat_interval_s = 60
  bool recurring_reports_enabled = false
  std::string recurring_reports_schedule
  std::string recurring_reports_recipients
  int recurring_reports_period_days = 7
  float health_score_threshold = 50.0f  // NEW: alert if health score drops below this

Config::load() and Config::loadOrDefault().
Healthchecks: split on FIRST = only.
Comma-separated: channels, services, dns_check_hosts, allowed_ips,
  config_watch_files, recurring_reports_recipients.
```

---

### TASK 2.4 — Agent: Logger

```
include/util/logger.hpp and src/util/logger.cpp
Thread-safe singleton. Levels: DEBUG INFO WARN ERROR.
Format: [YYYY-MM-DD HH:MM:SS.mmm] [LEVEL] message
ANSI colors on terminal, no ANSI in log file.
LOG_DEBUG/INFO/WARN/ERROR macros.
```

---

### TASK 2.5 — Agent: Signal Handling

```
include/util/signals.hpp and src/util/signals.cpp
SIGTERM/SIGINT → stop. SIGHUP → reload. sigaction().
```

---

### TASK 2.6 — Agent: main.cpp

```
src/main.cpp

CLI: --config, --port, --verbose, --version, --help, --json, --metrics,
     --tls, --no-tls, --check-config, --update

--update guard at top of main:
  #ifndef VPSMON_TLS
  if (updateFlag) {
    fprintf(stderr, "Self-update requires TLS support. Recompile with: make TLS=1\n");
    return 1;
  }
  #endif

Startup sequence:
1. Parse CLI; apply --update TLS guard
2. If --check-config: ConfigValidator::validate(config), exit 0/1
3. Config::loadOrDefault()
4. SignalHandler::setup()
5. Logger init
6. Print banner: version, port, TLS, rate_limit, allowed_ips count, PID, cooldownsPersisted
7. mkdir -p /var/lib/vpsmon
8. MetricsStore init (integrity check + schema + load cooldowns)
9. CollectorOrchestrator init
10. TcpServer/TlsServer init
11. AlertEngine init (loads cooldowns from MetricsStore)
12. UptimeTracker init
13. ConfigWatcher init
14. RecurringReportScheduler init
15. Start all subsystems
16. Main loop: sleep 100ms, check reload/stop, tick UptimeTracker + RecurringReportScheduler
17. SIGHUP: reload config, updateConfig() — cooldowns stay in memory (no re-fire)
18. SIGTERM: graceful shutdown

--json and --metrics: implemented in TASK 11.1
--update dispatch: implemented in TASK 11.2 (only reachable if VPSMON_TLS defined)
```

---

## PHASE 3 — Agent: Metric Collectors

---

### TASK 3.1 — Agent: MetricsStore with Tiered Downsampling, Cooldown Persistence, Health Score

```
include/storage/metrics_store.hpp and src/storage/metrics_store.cpp

Schema — CREATE TABLE IF NOT EXISTS:
  metrics_raw(id PK AUTOINCREMENT, timestamp INTEGER, metric TEXT, value REAL)
    INDEX (metric, timestamp)
  metrics_1min  — same schema
  metrics_5min  — same schema
  metrics_1hour — same schema
  anomaly_baseline(metric TEXT, hour INTEGER, mean REAL, stddev REAL, computed_at INTEGER
    PRIMARY KEY(metric, hour))
  uptime_log(id PK AUTOINCREMENT, timestamp INTEGER, status TEXT)
  alerts(id PK AUTOINCREMENT, timestamp INTEGER, metric TEXT, value REAL,
    threshold REAL, message TEXT, severity TEXT,
    resolved_at INTEGER DEFAULT 0, acknowledged INTEGER DEFAULT 0,
    acknowledged_by TEXT, acknowledged_at INTEGER,
    is_anomaly INTEGER DEFAULT 0, anomaly_sigma REAL DEFAULT 0.0)
  bandwidth(id PK AUTOINCREMENT, date TEXT, interface TEXT, rx_bytes INTEGER, tx_bytes INTEGER)
  downsampler_state(metric TEXT PRIMARY KEY, last_1min_ts INTEGER, last_5min_ts INTEGER, last_1hour_ts INTEGER)

  -- NEW: cooldown persistence
  alert_cooldowns(metric TEXT PRIMARY KEY, last_fired_ms INTEGER NOT NULL)

New methods beyond previous plan:
  // Cooldown persistence
  void saveCooldown(const std::string& metric, int64_t lastFiredMs);
  std::map<std::string, int64_t> loadCooldowns() const;

checkAndRepairDatabase():
  1. integrityCheck() → if false: rename .corrupt.<ts>, create fresh, return false
  2. Continue

queryHistory with maxPoints:
  std::vector<std::pair<int64_t, double>> queryHistory(
      const std::string& metric, int64_t fromTs, int maxPoints = 0);
  - If maxPoints > 0 AND result rows > maxPoints: apply time-bucket AVG downsampling
    Divide [fromTs, now] into maxPoints equal buckets
    For each bucket: AVG value of rows within it, timestamp = bucket midpoint
    Skip empty buckets (no gap-filling)
  - Tier selection: same as before (raw/1min/5min/1hour by age)

Health score metric:
  writeMetric("health_score", computedScore);  // called by CollectorOrchestrator after evaluate()

Downsampler: writes aggregated rows BEFORE deleting source rows (crash-safe).
```

---

### TASK 3.2 — Agent: Snapshot Structs + JSON Serializer

```
include/collectors/snapshot.hpp and src/collectors/snapshot.cpp

All structs mirror lib/schemas.ts exactly (including new fields).
DiskMount: daysUntilFull (double, -1.0=null), predictedUsage7d.

AlertRow extended: resolved_at, acknowledged, acknowledged_by, acknowledged_at,
  is_anomaly, anomaly_sigma.

Serializers:
  snapshotToJson(const Snapshot& s): string
  alertsToJson(const vector<AlertRow>& alerts): string  — full struct with all new fields
  uptimeToJson(const UptimeStats& stats): string
  agentHealthToJson(...): string — includes cooldownsPersisted field

All: no external JSON lib, manual string building, proper escaping,
-1.0 → null, camelCase matching TypeScript schemas exactly.
```

---

### TASK 3.3 — CPU Collector

```
/proc/stat delta computation. /proc/loadavg. /sys/class/thermal/ temperature.
First call: baseline, return 0%.
```

---

### TASK 3.4 — RAM Collector

```
/proc/meminfo (kB → bytes). All fields. Missing = 0.
```

---

### TASK 3.5 — Disk Collector with Prediction

```
DiskCollector(MetricsStore& store, bool predictionEnabled, int predictionHistoryHours);
/proc/diskstats fields 3,4,7,8. Latency = ticks/sectors. -1.0 if delta=0.
Skip pseudo-filesystems. statvfs() for usage.
updatePredictions() called once per hour: linearRegression on metrics_1hour data.
daysUntilFull = (slope > 0.001) ? (100-current)/(slope*24) : -1.0
pred7d clamped [0,100].
```

---

### TASK 3.6 — Network Collector with Counter-Wrap Detection

```
CRITICAL: rxDelta = (newRx < prevRx) ? newRx : (newRx - prevRx);
Log warning on wrap. addBandwidth() + resetBandwidthIfNeeded() each sample.
```

---

### TASK 3.7 — Process Collector

```
Enumerate /proc/[pid]/. CPU% and MEM% from stat+status.
Return top N sorted by cpuPercent desc.
```

---

### TASK 3.8 — Service Watcher

```
systemctl is-active via popen(). 5s cache. Map to running/failed/stopped/unknown.
```

---

### TASK 3.9 — Port Collector

```
/proc/net/tcp + tcp6 + udp. State 0x0A. inode→pid from /proc/[pid]/fd/.
Deduplicate, sort ascending, skip 0.
```

---

### TASK 3.10 — GPU Collector

```
NVIDIA: nvidia-smi CSV. AMD: /sys/class/drm/card0/device/. available=false if not found.
```

---

### TASK 3.11 — Docker Collector with Stat Caching

```
5s cache for container list AND per-container stats.
CPU% from cpu_stats delta. UptimeSeconds from Created RFC3339.
httpGetUnixSocket(): raw HTTP/1.0 GET over Unix socket.
```

---

### TASK 3.12 — File Descriptor Collector

```
/proc/sys/fs/file-nr fields 0 and 2. Top 5 consumers from /proc/[pid]/fd/.
```

---

### TASK 3.13 — DNS Probe

```
Raw UDP DNS for IP targets. getaddrinfo() for hostnames.
SO_RCVTIMEO=2s. CLOCK_MONOTONIC timing.
```

---

### TASK 3.14 — Healthcheck Runner

```
fork+exec via sh -c. 256-byte stdout pipe. waitpid WNOHANG loop.
SIGKILL on timeout. exitCode=-1 on timeout.
```

---

### TASK 3.15 — Uptime Tracker

```
include/collectors/uptime_tracker.hpp and src/collectors/uptime_tracker.cpp

UptimeTracker(MetricsStore& store, int heartbeatIntervalS, bool enabled);
tick(): log heartbeat if interval elapsed.
```

---

### TASK 3.16 — Config File Watcher (inotify)

```
include/collectors/config_watcher.hpp and src/collectors/config_watcher.cpp

inotify_init1(IN_NONBLOCK). inotify_add_watch for IN_MODIFY|IN_CLOSE_WRITE on each file.
poll() 1000ms timeout. On event: LOG_INFO + alerts_.triggerConfigChangeAlert(filename).
Config changes are NOT suppressed by maintenance windows.
```

---

### TASK 3.17 — Anomaly Engine + Resolution (inside AlertEngine)

```
Extend alert_engine.cpp evaluate():

After threshold checks, if anomaly_enabled:
  For each metric (cpu, ram, disk per mount, fd, health_score):
    AnomalyBaseline b = store_.getAnomalyBaseline(metric, currentHour);
    if (b.datapoints < config.anomaly_min_datapoints) continue;
    if (b.stddev < 0.5) continue;
    double z = (currentValue - b.mean) / b.stddev;

    if (std::abs(z) > config.anomaly_threshold_sigma):
      // Check cooldown (same cooldown map as threshold alerts)
      if (within cooldown) continue;
      store_.writeAlertAnomaly(metric, currentValue, z, msg, severity);
      dispatch(msg, metric, currentValue, 0.0);
      cooldowns_[metric] = now;
      store_.saveCooldown(metric, now);  // PERSIST cooldown

    else:
      // Check if there's an active (unresolved) anomaly alert for this metric
      // If so: resolve it
      auto active = store_.getActiveAnomalyAlert(metric);
      if (active.has_value()) {
        store_.resolveAlert(active->id, now_ms);
      }

NEW MetricsStore method:
  std::optional<AlertRow> getActiveAnomalyAlert(const std::string& metric);
    - SELECT * FROM alerts WHERE metric=? AND is_anomaly=1 AND resolved_at=0 LIMIT 1
```

---

### TASK 3.18 — Process Watchdog (inside AlertEngine)

```
Extend alert_engine.cpp evaluate() after anomaly checks:

For each service in snapshot.services:
  if status == "failed" or "stopped":
    trigger("process_" + name, 1.0, 0.0, "Service <name> is <status>", "critical")
    // No warmup delay for service failures — always fire immediately
    // Still respects cooldown
  if status == "running":
    bool found = any proc.name == service.name in snapshot.processes
    if !found:
      trigger("ghost_" + name, 1.0, 0.0, "Ghost service: <name> reports running but no process found", "warning")
```

---

### TASK 3.19 — Maintenance Window Poller (inside AlertEngine)

```
Extend alert_engine.cpp:

Add maintenance status polling if config.maintenance_check_url is non-empty:

class MaintenancePoller {
public:
  explicit MaintenancePoller(const std::string& url);
  bool isActive() const;
  void poll();  // called every 30s from main loop tick or AlertEngine
private:
  std::string url_;
  std::atomic<bool> active_{false};
  int64_t lastPoll_ = 0;
  std::string httpGet(const std::string& url);  // raw HTTP GET
};

poll(): if (now - lastPoll_ > 30000) { fetch url_, parse {"active":bool}, update active_ }
isActive(): return active_.load()

AlertEngine holds a MaintenancePoller instance (null if url is empty).
In evaluate(): if (maintenancePoller_ && maintenancePoller_->isActive()) {
  // Set suppressed=1 on alert (still write to DB for history)
  // Skip channel dispatch
  writeAlertSuppressed(metric, ...);
  return;
}
```

---

### TASK 3.20 — Collector Orchestrator (Updated)

```
include/collectors/collector.hpp and src/collectors/collector.cpp

CollectorOrchestrator(AgentConfig, MetricsStore&);
start(), stop(), getLatestSnapshot(), updateConfig().

runLoop():
STARTUP WARMUP: track startTime. Alert engine warmup flag for first startup_warmup_s seconds.

1. sample() first pass (baseline)
2. Sleep interval_ms
3. sample() second pass
4. Build Snapshot
5. DNS+healthchecks: only if shouldRun()
6. Docker: getContainers() (cached internally)
7. hostname, uptime, timestamp
8. AlertEngine.evaluate(snapshot) — thresholds + anomaly + watchdog + maintenance suppression
9. Compute health_score from snapshot (same algorithm as frontend HealthScore component)
10. writeMetricBatch: cpu, ram, disk (per mount), network, gpu, fd, health_score
11. disk prediction metrics for regression
12. Update latest_ under write lock
13. Repeat

std::shared_mutex for snapshot access.
```

---

## PHASE 4 — Agent: TCP Server, Alerts, Recurring Reports

---

### TASK 4.1 — JSON Request Parser

```
AgentRequest struct:
  cmd: snapshot|history|alerts|ping|health|bandwidth|test-alert|
       resolve-alert|acknowledge-alert|logs|uptime|update|set-anomaly-baseline
  metric, duration, maxPoints (default 0=unbounded), period, alert_id,
  lines (default 100), key (for TUI auth)

parseRequest(json): throws std::invalid_argument on missing cmd or bad JSON.
```

---

### TASK 4.2 — Per-IP Rate Limiter with Allowlist

```
RateLimiter(int maxRps, const vector<string>& allowedIps);

allow(ip):
  1. If allowedIps_ non-empty AND ip NOT in allowedIps_: return false (BLOCKED — no response sent)
  2. If loopback: return true always
  3. Sliding window rate check

evictStale(): entries older than 60s.
Thread-safe with std::mutex.

Note: allowlist rejection (step 1) closes the socket with no response — different from
rate-limit rejection (step 3) which sends a JSON error before closing.
```

---

### TASK 4.3 — TCP Server with Rate Limiting, Allowlist, TUI Auth

```
TcpServer(bind, port, collector, store, rateLimitRps, allowedIps, tuiAuthEnabled);

handleClient(fd, ip):
  1. allowedIps check via rateLimiter_.allow(ip) — if blocked: close socket immediately (no response)
  2. Rate limit check — if limited: send JSON error, close
  3. SO_RCVTIMEO=5s. Read until '\n' or 4096 bytes.
  4. If tuiAuthEnabled_: parse "key" field from JSON, verify via store_ key table or inline check
     (simplified: check against a pre-loaded list of valid key hashes)
  5. dispatch() and write response + '\n'
  6. close, decrement activeClients_

dispatch() handles ALL commands including:
  history: pass maxPoints from request down to store_.queryHistory(metric, fromTs, maxPoints)
  resolve-alert: store_.resolveAlert(alert_id, now_ms)
  acknowledge-alert: store_.acknowledgeAlert(alert_id, acknowledged_by)
  logs: popen journalctl -n lines --no-pager; fallback to logger file; cap at 500
  uptime: store_.queryUptime(period)
  update:
    #ifndef VPSMON_TLS
    return {"ok":false,"error":"self-update requires TLS — recompile with make TLS=1"}
    #else
    if not loopback: return error
    spawn SelfUpdater::performUpdate() on detached thread
    return {"ok":true,"data":{"status":"update initiated, agent will restart"}}
    #endif
  health: include cooldownsPersisted:true in response
  set-anomaly-baseline: trigger store_.updateAnomalyBaseline() for all metrics at current hour

Reject if activeClients_ >= 50.
```

---

### TASK 4.4 — TLS Server (Optional)

```
TlsServer extends TcpServer. Only compiled with VPSMON_TLS=1.
OpenSSL: TLS_server_method, load cert+key, SSL_accept per client.
```

---

### TASK 4.5 — Alert Engine + All Channels + Cooldown Save

```
AlertEngine(config, MetricsStore&);
Constructor: cooldowns_ = store_.loadCooldowns();  // RESTORE persisted cooldowns

evaluate(): thresholds + anomaly + watchdog + maintenance suppression + health score threshold.
triggerTest(): dispatch through all enabled channels, return channel names.
triggerConfigChangeAlert(filename): warning alert, no cooldown, no maintenance suppression.
updateConfig(config).

On every trigger:
  cooldowns_[metric] = now;
  store_.saveCooldown(metric, now);  // persist immediately

All channel files: slack, discord, telegram (#ifdef TLS), smtp (#ifdef TLS for STARTTLS),
pagerduty, webhook. All dispatch on detached threads. Failed = LOG_WARN, continue.
```

---

### TASK 4.6 — Recurring Report Scheduler

```
include/alerts/recurring_report_scheduler.hpp and src/alerts/recurring_report_scheduler.cpp

RecurringReportScheduler(config, MetricsStore&);
tick(): called from main loop every ~60s — check cron/once schedule, fire if due.

CRITICAL: Persist lastRun_ to SQLite to survive restarts:
  New table: scheduler_state(name TEXT PRIMARY KEY, last_run_ms INTEGER)
  On init: load last_run_ms for "recurring_report" from DB
  On fire: save updated last_run_ms before dispatch (not after — idempotent on crash)

shouldRun(): parse schedule, check if current time matches AND last_run_ms was > 23h ago
  (prevents double-fire within same minute tick)

buildHtmlReport(periodDays): inline-styled HTML email (table-based, no CSS classes).
  Compute avg CPU, peak RAM, disk % per mount, alert count, healthcheck summary.
  All colors hardcoded for email client compatibility.

Sends via SmtpChannel to each recipient. Subject: "VPS Health Report: <hostname> — <daterange>"
```

---

### TASK 4.7 — Config Validation Command

```
include/util/config_validator.hpp and src/util/config_validator.cpp

ConfigValidator::validate(config): vector<CheckResult>

Checks:
1. db_path parent directory writable: access(dir, W_OK)
2. TLS cert+key readable (if tls=true)
3. Docker socket exists (if docker_enabled)
4. nvidia-smi in PATH (if gpu_backend==nvidia or auto)
5. Each watched service exists: systemctl list-units | grep
6. Webhook URLs reachable: HTTP HEAD, 3s timeout, failures are WARNING not FAIL
7. maintenance_check_url reachable (if set): HTTP GET, expect {"active":bool}
8. DNS hosts: at least one configured (if dns_enabled)
9. SMTP host non-empty (if recurring_reports_enabled or smtp in channels)
10. allowed_ips: each entry is valid IPv4 or IPv6 format
11. Self-update: if --update flag was passed, check TLS is compiled in

Print ✓/✗/⚠ per check. Exit 0 if no ✗, exit 1 if any ✗.
```

---

### TASK 4.8 — Systemd + Example Config + Install Script

```
vpsmon-agent.service: standard unit with After/Wants docker.service.

vpsmon.conf.example: ALL config options including ALL new fields:
  tui_auth_enabled, maintenance_check_url, health_score_threshold
  Every option: comment, valid range, default, example.

agent/scripts/install.sh:
  OS detection, build deps install, make, install, systemd setup.
  --tls flag: also installs libssl-dev and builds with TLS=1
  --tui flag: also builds and installs vpsmon-tui
```

---

## PHASE 5 — Next.js API Routes

---

### TASK 5.1 — Server Config, Agent TCP Helper, OpenAPI

```
lib/servers.ts: getServers(), getServer(id), agentRequest(server, payload, timeoutMs=3000).
  TLS support: if server config has tls=true, use tls.connect() instead of net.Socket.
  agentRequest always passes "maxPoints":300 to history commands automatically.

lib/openapi.ts: full OpenAPI 3.1 from ALL schemas using zod-to-json-schema.
  Documents all routes including: uptime, logs, groups, maintenance, widgets,
  alert comments, deploy webhook, audit, silences, share.

.env.local.example: ALL env vars documented including:
  VPSMON_MAINTENANCE_PATH, VPSMON_SILENCES_PATH, VPSMON_SHARES_PATH,
  VPSMON_AUDIT_PATH, VPSMON_AUDIT_RETENTION_DAYS, VPSMON_AUDIT_ANONYMIZE_IPS,
  VPSMON_AUDIT_ENABLED, VPSMON_WEBHOOK_SECRET, VPSMON_EXPECTED_AGENT_VERSION,
  VPSMON_MAINTENANCE_CHECK_URL (for documentation purposes — this is agent-side)
```

---

### TASK 5.2 — proxy.ts — Auth Gate

```
vpsmon/web/proxy.ts (Next.js 16: both file and function named `proxy`)

Public paths: /login, /api/auth/, /_next/, /favicon.ico, /api/health,
              /api/webhook/deploy (has own HMAC auth),
              /share/ (public share pages),
              /api/share/ (but NOT /api/share/route itself — only token-specific sub-routes)

Auth disabled: if !isAuthEnabled() → NextResponse.next()
Auth check: verifyApiKeyCached(key) — safe file-not-found handling built in
Set X-User-Role header on pass.
Redirect unauthenticated pages to /login.
Return 401 JSON for unauthenticated API routes.
```

---

### TASK 5.3 — API Routes: Core Agent Data

```
All: await params (Next.js 16). No "use cache". Check isMockMode().
Validate inputs with Zod .safeParse() → 400 on failure.
Pass maxPoints:300 to all history requests via agentRequest.

snapshot/route.ts: GET → agentRequest({cmd:'snapshot'})
history/route.ts: GET ?metric&duration → agentRequest({cmd:'history',metric,duration,maxPoints:300})
alerts/route.ts: GET → agentRequest({cmd:'alerts'})
  After receiving alerts:
    1. For each alert: check isInMaintenanceWindow(serverId) → set suppressed=true, suppressedReason='maintenance'
    2. For each alert: check isMetricSilenced(serverId, alert.metric) → set suppressed=true, suppressedReason='silence'
ping/route.ts: GET → measure RTT
health/route.ts: GET → agentRequest({cmd:'health'}) + version mismatch check
bandwidth/route.ts: GET ?period → agentRequest({cmd:'bandwidth',period})
uptime/route.ts: GET ?period → agentRequest({cmd:'uptime',period})
logs/route.ts: GET ?lines=N → agentRequest({cmd:'logs',lines:N}), admin only
```

---

### TASK 5.4 — API Routes: Alert Actions, Annotations, Export

```
alerts/[alertId]/route.ts:
  PATCH { acknowledged: true, acknowledgedBy? } → agentRequest({cmd:'acknowledge-alert',...})

alerts/[alertId]/comments/route.ts:
  GET → getComments(alertId)
  POST { text } → addComment(alertId, serverId, text, role-from-header)

annotations/route.ts: GET | POST
annotations/[id]/route.ts: DELETE (admin)

export/route.ts: GET ?format=csv|json|pdf &range=7d|30d|custom &sections=... &companyName=...
  PDF: generateSummaryReport(... , options parsed from query params) — light-mode colors
  CSV/JSON: fetch history and return

test-alert/route.ts: POST → agentRequest({cmd:'test-alert'}), admin only

silences/route.ts: GET → getSilences(serverId) | POST → createSilence() (admin)
silences/[id]/route.ts: DELETE → deleteSilence(id) (admin)
```

---

### TASK 5.5 — API Routes: Groups, Maintenance, Widgets, Deploy Webhook, Share

```
api/groups/route.ts: GET | POST (admin)
api/groups/[groupId]/route.ts: PATCH | DELETE (admin)

settings/maintenance/route.ts: GET ?serverId | POST (admin)
  POST: validate cron expression with parseCronExpression() before saving
  If invalid: return 400 with error message
settings/maintenance/[id]/route.ts: PATCH | DELETE (admin)

api/servers/[id]/widgets/route.ts: GET | POST (admin)
api/servers/[id]/widgets/[id]/route.ts: DELETE (admin)

api/webhook/deploy/route.ts:
  CRITICAL: If VPSMON_WEBHOOK_SECRET is not set → return 503 {"error":"Webhook not configured — set VPSMON_WEBHOOK_SECRET"}
  POST: verify HMAC-SHA256 signature (GitHub/GitLab/generic auto-detect)
  On success: createAnnotation() for the target server

api/share/route.ts: GET (admin) → getShareTokens() | POST (admin) → createShareToken()
api/share/[token]/route.ts: DELETE (admin)
api/share/[token]/snapshot/route.ts:
  GET — PUBLIC, no Authorization header required
  verifyShareToken(token) → if null or expired: 404/410
  Fetch snapshot from agent, strip: processes, ports, logs, annotations
  Return limited snapshot (cpu, ram, disk, network, services, health, uptime only)

api/auth/audit/route.ts: GET (admin)
api/servers/[id]/update/route.ts: POST (admin) → agentRequest({cmd:'update'})

api/openapi.json/route.ts: GET → "use cache" + cacheLife('hours')
api/health/route.ts: GET → "use cache" + cacheLife('seconds')
settings/thresholds/route.ts: GET | POST (admin)
```

---

## PHASE 6 — Frontend: Layout & Shell

---

### TASK 6.1 — Dashboard Layout

```
components/layout/DashboardLayout.tsx
Props: { children; serverId?; serverName?; isOnline?; isMaintenance? }

Header (h-12, sticky, border-b):
- Left: "vpsmon" font-mono font-bold + "v0.1" Badge
- Center: server name + online/offline Badge (on detail) | ServerSearch (on home)
- Right: isMaintenance → purple "In Maintenance" Badge
         NotificationBell, ThemeToggle, Settings link, GitHub link

Mock mode banner below header if isMockMode.
```

---

### TASK 6.2 — Server Header

```
components/panels/ServerHeader.tsx
Props: { hostname, uptime, loadAvg1/5/15, isOnline, lastUpdated,
         agentVersion?, versionMismatch?, isMaintenance?, maintenanceLabel?,
         healthScore? }

Left: hostname + Badge. Center: uptime + loadAvg. Right: HealthScore + "Updated Xs ago".
Banners: versionMismatch (amber) | isMaintenance (purple).
```

---

### TASK 6.3 — Sparkline and Latency Sparkline

```
components/charts/Sparkline.tsx — pure SVG, cubic bezier, gradient, clip animation.

components/charts/LatencySparkline.tsx:
  domain [0, 200] ms, cyan color. Shows current latency text: "2ms" or "—".
```

---

### TASK 6.4 — History Graph with Annotation Markers + Inline Delete

```
components/charts/HistoryGraph.tsx ('use client')

Props: { data, annotations, metric, unit, color, height, timeRange, serverId, onAddAnnotation }

Annotations as Recharts ReferenceLine. On annotation hover: × button to inline delete.
Config-change annotations: orange color, auto-rendered.
Click chart: onAddAnnotation(timestamp) if provided.
```

---

## PHASE 7 — Frontend: All Metric Panels

---

### TASK 7.1 — CPU Panel

```
CpuPanel.tsx ('use client'). Cpu icon + usage% Badge + large % + Sparkline.
Temp, load avgs, per-core bars. Drag handle. fadeInUp.
```

---

### TASK 7.2 — RAM Panel

```
RamPanel.tsx ('use client'). Usage % + Sparkline. Stacked breakdown bar. Swap.
```

---

### TASK 7.3 — Disk Panel with Prediction

```
DiskPanel.tsx ('use client').
Per mount: bar, usage, I/O rates, latency.
Prediction badge: amber <90 days, red <14 days. Tooltip explains methodology.
```

---

### TASK 7.4 — Network Panel

```
NetworkPanel.tsx ('use client'). Two sparklines (RX/TX). Rates. Totals. Additional interfaces.
```

---

### TASK 7.5 — Bandwidth Panel

```
BandwidthPanel.tsx ('use client'). useBandwidth hook. Day/Week/Month tabs. Stat blocks.
```

---

### TASK 7.6 — GPU Panel

```
GpuPanel.tsx ('use client'). Empty if !available. Backend Badge. % + Sparkline. VRAM bar.
```

---

### TASK 7.7 — Docker Panel

```
DockerPanel.tsx ('use client'). Table: Name|Image|CPU%|Memory|Uptime|State. "Stats refresh every 5s" note.
```

---

### TASK 7.8 — File Descriptor Panel

```
FdPanel.tsx ('use client'). X/Y + % + bar + top consumers table. Warning Tooltip.
```

---

### TASK 7.9 — DNS Panel

```
DnsPanel.tsx ('use client'). Table: Host|Latency|Status|Last checked. Color by latency.
```

---

### TASK 7.10 — Healthchecks Panel

```
HealthchecksPanel.tsx ('use client'). X/Y Badge. Click to expand stdout. Failed first.
```

---

### TASK 7.11 — Processes Table

```
ProcessesTable.tsx ('use client'). Sortable, filter, State Badges. Top 15, expand toggle.
```

---

### TASK 7.12 — Services Panel

```
ServicesPanel.tsx ('use client'). X/Y Badge. Pulse dot. Red glow on failed.
```

---

### TASK 7.13 — Alert Components with Acknowledgment, Comments, and Silencing

```
components/alerts/AlertTicker.tsx ('use client')
Suppressed alerts (maintenance OR silence): muted styling, not in ticker.
Unacknowledged active alerts: in ticker.

components/alerts/AlertHistory.tsx ('use client')
Props: { serverId; alerts; isPending }

Per-alert row:
  - Severity badge + metric + message + timestamp
  - isAnomaly: purple "Anomaly" tag + sigma value (formatSigma)
  - suppressed + suppressedReason='maintenance': gray "Suppressed (maintenance)" tag
  - suppressed + suppressedReason='silence': gray "Silenced" tag + silence reason in Tooltip
    + "Manage silences" link → /settings/silences
  - resolved: green "Resolved X ago"
  - acknowledged: muted "Acknowledged by <who>"

Click to expand:
  - Full message, threshold, anomaly sigma
  - Comments list + add comment input (admin only)
  - "Acknowledge" button (admin only)
  - "Silence this metric" button (admin only): opens SilenceCreateDialog
    Fields: reason (text), expires in (None / 1d / 7d / 30d / custom date)
    On save: createSilence(serverId, {metric, reason, expiresAt})
```

---

### TASK 7.14 — Open Ports Panel

```
PortsPanel.tsx ('use client'). Table: Port|Protocol|Service|Process. WELL_KNOWN_PORTS. Sort ascending.
```

---

### TASK 7.15 — Uptime Panel

```
UptimePanel.tsx ('use client'). Uses useUptimeData.
Large % colored by range. Timeline bar with gap segments. Day/Week/Month tabs.
```

---

### TASK 7.16 — Logs Panel

```
components/logs/LogsPanel.tsx ('use client'). Uses useLogs.
Line count Select, search highlight, auto-scroll, download button.
```

---

### TASK 7.17 — Config Change Events Panel

```
ConfigChangesPanel.tsx ('use client'). Filters useAlerts for metric='config_change'.
Orange "Changed" badges. Click for detail Dialog.
```

---

### TASK 7.18 — Custom Metric Widget Panel

```
CustomWidgetPanel.tsx ('use client')
Props: { widget: CustomWidget; snapshot: Snapshot; history?: HistoryPoint[] }

Expression evaluator (recursive descent, no eval()):
  Supports: +,-,*,/, parentheses, numbers, field paths (dot notation + array index [N]),
  Math.min(), Math.max()
  field[0].subfield: split on '.', handle [N] as array index.
  Error cases from CONTEXT.md table: NaN→"—", Infinity→"∞", parse error→"ERR" in red.

Layout: Zap icon + title + large computed value + unit + Sparkline + threshold color.
Edit/Delete icons (admin only).
```

---

### TASK 7.19 — Health Score Badge Component

```
components/ui/HealthScore.tsx ('use client')
Weighted 0–100 score. Size variants: sm (card), md (header), lg (standalone).
90+=green, 70-89=amber, <70=red.
```

---

## PHASE 8 — Frontend: Pages

---

### TASK 8.1 — Server List Home Page with Search, Groups, and Latency

```
app/page.tsx (Server Component): await searchParams, fetch servers + groups.
components/layout/ServerListView.tsx ('use client'):
  Search, group filter. Non-matching dimmed.
components/layout/ServerCard.tsx ('use client'):
  useSnapshot(5000) + useLatencyHistory.
  HealthScore (sm), LatencySparkline, CPU/RAM/Disk bars, group color border.
  Purple tint if isMaintenance.
components/layout/GroupCard.tsx ('use client'):
  Aggregate worst metrics across group servers.
```

---

### TASK 8.2 — Server Detail Page

```
app/servers/[id]/page.tsx (Server Component): await params → <ServerDashboard />

components/layout/ServerDashboard.tsx ('use client'):
  useSnapshot, useAlerts, useAgentHealth, useLayout, useAnnotations,
  useKeyboardShortcuts, useWidgets, useUptimeData, useMaintenance, useSilences.

  Sentry breadcrumb on versionMismatch.

  "Live" tab — DndContext + SortableContext. All panels including:
    UptimePanel, LogsPanel, ConfigChangesPanel, CustomWidgetPanel(s).

    Snapshot Diff button: "Take Baseline" → store snapshot;
      "Compare to Baseline" → SnapshotDiffDialog.

  "History" tab:
    HistoryGraph with annotations (inline delete ×).
    "Add annotation" button → AddAnnotationDialog.
    Config change events auto-rendered as orange markers.

  "Bandwidth" tab: BandwidthPanel.
  "Logs" tab: LogsPanel.

  AlertTicker (fixed bottom, suppressed alerts excluded).
  States: PageSkeleton, AgentOffline, stale banner.
```

---

### TASK 8.3 — Snapshot Diff Dialog

```
components/layout/SnapshotDiffDialog.tsx ('use client')
Props: { baseline: Snapshot; current: Snapshot; baselineTs: number; onClose: () => void }

Compute deltas for all numeric scalars. Filter < 5% change. Sort by |delta| desc.
Table: Metric | Baseline | Current | Delta | Arrow (colored).
"Clear Baseline" + "Close" buttons.
```

---

### TASK 8.4 — Server Search Component

```
components/layout/ServerSearch.tsx ('use client')
Main search input. Popover with status filter + CPU filter.
Active filter count Badge. Fully controlled.
```

---

### TASK 8.5 — Multi-Server Comparison Page

```
app/compare/page.tsx (Server Component): await searchParams → <CompareView />.
Up to 4 servers. grid-cols-{n}. URL-persisted a/b/c/d params.
Per column: ServerHeader + CpuPanel + RamPanel + DiskPanel + NetworkPanel + UptimePanel + HealthScore.
```

---

### TASK 8.6 — Server Groups Pages

```
app/groups/page.tsx: GroupManagementView (table + create/edit/delete).
app/groups/[groupId]/page.tsx: GroupDashboardView (group header + ServerCard grid).
```

---

### TASK 8.7 — Public Share Page

```
app/share/[token]/page.tsx (Server Component): await params.
  verifyShareToken(token) → if null/expired: show "Link expired or invalid" page.
  Fetch /api/share/[token]/snapshot (public endpoint).
  Render read-only stripped dashboard: CpuPanel, RamPanel, DiskPanel, NetworkPanel,
    ServicesPanel, UptimePanel, HealthScore.
  No AlertHistory, no Logs, no Processes, no Ports, no drag handles, no settings link.
  Header shows: "vpsmon — [server name] — Read-only view" with an info badge.
  Footer: "This link expires [date]" or "This link does not expire".
  No auth required. No API key in localStorage for this page.
```

---

## PHASE 9 — Frontend: Advanced Features

---

### TASK 9.1 — Keyboard Shortcuts

```
hooks/useKeyboard.ts ('use client'). All shortcuts from CONTEXT.md.
components/layout/KeyboardHelpOverlay.tsx: Dialog with Kbd shortcuts table.
```

---

### TASK 9.2 — Fullscreen Panel Mode

```
hooks/useFullscreen.ts ('use client').
components/ui/FullscreenPanel.tsx: fixed overlay, React 19.2 View Transitions.
Maximize2 icon on every panel header.
```

---

### TASK 9.3 — Notification Center

```
components/alerts/NotificationCenter.tsx ('use client')
Bell + unread count Badge. shadcn Sheet from right.
Groups by server. Unread = blue border.
Anomaly alerts: purple sigma badge. Suppressed (maintenance/silence): gray tag.
Mark all read / Clear all. localStorage 'vpsmon-notif-seen'.
```

---

### TASK 9.4 — Theme Toggle

```
components/settings/ThemeToggle.tsx ('use client'). Moon/Sun/Monitor. Tooltip. cycleTheme().
```

---

### TASK 9.5 — Draggable Panel Layout

```
hooks/useLayout.ts ('use client'):
  DEFAULT_LAYOUT: all panels including uptime, logs, config_changes, bandwidth.
  Custom widget panels: id 'widget_<id>', dynamically added.
  addWidgetPanel(widgetId), removeWidgetPanel(widgetId).

components/layout/SortablePanelWrapper.tsx ('use client'):
  useSortable from @dnd-kit/sortable. GripVertical drag handle.
```

---

### TASK 9.6 — Settings Pages: Keys, Maintenance, Silences, Share, Widgets, Audit

```
app/settings/page.tsx: General + Key Manager + Audit Log
app/settings/thresholds/page.tsx: ThresholdEditor (with dual-threshold note)
app/settings/maintenance/page.tsx: MaintenanceWindowEditor (with cron validation)
app/settings/silences/page.tsx: SilenceEditor

Key Manager: expiresAt column + expiry date picker + expired badge.

Maintenance Window Editor:
  On save: call parseCronExpression() — show error if invalid or uses unsupported syntax.
  cronstrue live preview of schedule.
  Note: "Agent-level suppression requires VPSMON_MAINTENANCE_CHECK_URL in agent config."

Silence Manager:
  Table: server, metric, reason, created by, expires, actions.
  Create: serverId select + metric input + reason + optional expiry.
  Delete = lift silence immediately.

Share Manager:
  Table: label, server, created, expires, token (masked).
  "Copy link" button. "Revoke" button.
  Create: server select + label + optional expiry date.

GDPR note in audit log section:
  "IP addresses are anonymized by default (last octet replaced).
  To disable: set VPSMON_AUDIT_ANONYMIZE_IPS=false in environment.
  Entries older than VPSMON_AUDIT_RETENTION_DAYS are automatically purged."
```

---

### TASK 9.7 — Sentry + Web Vitals

```
@sentry/nextjs wizard. sentry.client.config.ts + sentry.server.config.ts.
Capture agent TCP errors + version mismatch breadcrumbs.
components/WebVitals.tsx: useReportWebVitals → console (dev) / Sentry (prod).
```

---

## PHASE 10 — Polish & Production Readiness

---

### TASK 10.1 — Loading Skeletons and Error States

```
PanelSkeleton.tsx, PageSkeleton.tsx, PanelError.tsx, AgentOffline.tsx.
app/error.tsx, app/not-found.tsx.
```

---

### TASK 10.2 — Data Formatting Utilities

```
lib/format.ts — all previous functions PLUS:
  formatSigma(z: number): string  // 3.21 → "3.2σ"
  formatHealthScore(score: number): { label: string; color: string }
  parseCronToHuman(cron: string): string  // uses cronstrue library
  formatCronSchedule(schedule: string): string
    // "cron:0 2 * * 0" → parseCronToHuman("0 2 * * 0")
    // "once:1712345678000" → "One-time: Mon Apr 5 at 02:00"
  WELL_KNOWN_PORTS: expanded (RabbitMQ, Kafka, Elasticsearch, etc.)
  getPanelInterval(panelId, defaultMs): reads from IntervalsProvider context
```

---

### TASK 10.3 — Responsive Layout and Design Audit

```
All panels: Tailwind v4 sm:/md:/lg:/xl: prefixes only.
Mobile: 1-column, hide secondary columns.
Consistent panel headers, threshold colors, animations.
No useMemo/useCallback/React.memo.
GripVertical on every panel.
Anomaly: purple color. Suppressed: gray muted. Maintenance: purple tint.
```

---

## PHASE 11 — CLI, TUI, Docker, README

---

### TASK 11.1 — Agent: --json, --metrics, --check-config

```
--json: two samples (500ms sleep), snapshotToJson(), print, exit 0.

--metrics: Prometheus exposition including:
  vpsmon_health_score {value}
  vpsmon_anomaly_detection_enabled (1/0)
  vpsmon_cooldowns_persisted (1/0)
  vpsmon_uptime_heartbeat_last_ts
  ... all existing metrics ...

--check-config: ConfigValidator::validate(config), print ✓/✗/⚠, exit 0/1.
```

---

### TASK 11.2 — Agent: Self-Update (TLS=1 Required)

```
include/util/self_updater.hpp and src/util/self_updater.cpp

CRITICAL: This file is ONLY compiled when VPSMON_TLS=1.
Wrap entire implementation in #ifdef VPSMON_TLS ... #endif.

In tcp_server.cpp dispatch for 'update':
  #ifndef VPSMON_TLS
  return error JSON "self-update requires TLS — recompile with make TLS=1"
  #else
  spawn thread calling SelfUpdater::performUpdate("yourname", "vpsmon")
  return initiated response
  #endif

SelfUpdater::performUpdate():
1. HTTPS GET api.github.com/repos/<owner>/<repo>/releases/latest via SSL_connect()
2. Extract asset URLs from JSON (no JSON lib — manual string scan)
3. Download vpsmon-agent-linux-amd64.tar.gz and .sha256 to /tmp/vpsmon-update-<ts>/
4. Verify SHA256 (compute via OpenSSL EVP_DigestInit/Update/Final or manual SHA256)
5. If mismatch: return {false, "", "SHA256 verification failed"}, clean up
6. Extract binary: popen("tar -xzf ... -C /tmp/vpsmon-update-<ts>/")
7. cp /usr/local/bin/vpsmon-agent → .bak
8. cp extracted → /usr/local/bin/vpsmon-agent; chmod +x
9. kill(getpid(), SIGTERM)
```

---

### TASK 11.3 — vpsmon-tui: Terminal Dashboard

```
vpsmon/agent/tui/main_tui.cpp

CLI:
  --host, --port, --key (API key), --tls (requires VPSMON_TLS=1), --light-bg
  --servers vps-01:host:port,vps-02:host:port

API KEY AUTH: Include key in all JSON requests:
  {"cmd":"snapshot","key":"<key>"}
  If no --key flag: send requests without key field (works when tui_auth_enabled=false).

TLS: Use SSL_connect() when --tls is set.
  #ifndef VPSMON_TLS
  if (tlsFlag) { fprintf(stderr, "TUI TLS requires compilation with make tui-tls\n"); exit(1); }
  #endif

LIGHT-BG mode (--light-bg):
  All COLOR_BLACK backgrounds replaced with COLOR_WHITE.
  White text replaced with black text.
  Uses a boolean flag that swaps init_pair() calls.

ncurses layout (as specified in previous version).
Multi-server tab switching. JSON parser copied into tui/ (isolated, not linked from agent).
```

---

### TASK 11.4 — Docker Support

```
agent/Dockerfile: ubuntu:22.04, g++ make. Comment: --pid=host required.
web/Dockerfile: node:20-alpine multi-stage, output:standalone.
docker-compose.yml:
  agent: pid:host, docker.sock:ro, vpsmon-data volume
  web: ALL env vars including VPSMON_WEBHOOK_SECRET (set to a strong random value in example),
    VPSMON_AUDIT_ANONYMIZE_IPS=true, VPSMON_SHARES_PATH, VPSMON_SILENCES_PATH
  Volumes: vpsmon-data + vpsmon-web-data (for all JSON config files)
```

---

### TASK 11.5 — next.config.ts and CHANGELOG

```
next.config.ts: reactCompiler:true, turbopackFileSystemCache:true, output:'standalone'
CHANGELOG.md: complete 0.1.0 entry with ALL features.
VERSION file: "0.1.0"
scripts/bump-version.sh: reads VERSION, increments, updates CHANGELOG, git commit.
```

---

### TASK 11.6 — PDF Summary Report (Light-Mode, Customizable)

```
lib/report.tsx: generateSummaryReport(data, options: ReportOptions)

CRITICAL: ALWAYS light-mode colors (white bg, dark text) — never dark theme.
CRITICAL: Only render sections listed in options.sections.

PDF sections:
  cover: company name (options.companyName or hostname), logo if provided, period, date
  summary: avg CPU, peak RAM, disk usage, total bandwidth, uptime %, health score text
  cpu/ram/disk/network/uptime/alerts/healthchecks: as before

renderToBuffer() server-side.
```

---

### TASK 11.7 — Final README

```
vpsmon/README.md

All sections from previous plan PLUS:
  - Maintenance windows: split-brain limitation + VPSMON_MAINTENANCE_CHECK_URL setup
  - Per-metric silences: how they work, frontend-only limitation
  - Public share links: how to create, what data is exposed, what is excluded
  - Alert cooldown persistence: survives restarts, no alert storms
  - History maxPoints: automatic 300-point cap, explanation
  - Self-update TLS requirement: must compile with make TLS=1
  - vpsmon-tui: --key flag for auth, --tls flag, --light-bg flag
  - Cron evaluator scope: exact features supported and NOT supported
  - Custom widget expressions: array syntax, error cases
  - GDPR/privacy: audit log anonymization, retention, opt-out
  - PDF export: light-mode colors always, customizable sections
```

---

## PHASE 12 — Testing

---

### TASK 12.1 — Agent Unit Tests

```
tests/test_runner.hpp: ASSERT macro + registration.

test_config.cpp: all fields including new ones.

test_json.cpp:
  snapshot_to_json_complete, alerts_to_json with resolved_at/acknowledged/is_anomaly,
  anomaly_sigma null when not anomaly, agentHealthToJson with cooldownsPersisted

test_collectors.cpp:
  cpu_range, ram_sanity, fd_sanity, counter_wrap_detection, linear_regression,
  anomaly_zscore: correct Z-score for known mean/stddev,
  anomaly_resolution: active anomaly alert resolved when z drops below threshold,
  watchdog_ghost_service, watchdog_dead_service,
  health_score_written: CollectorOrchestrator writes health_score metric to store

test_store.cpp:
  write_and_query_raw, downsampling_write_before_delete: verify source rows not deleted until aggregate written,
  tier_selection, integrity_check_and_repair, bandwidth_counter_wrap,
  uptime_heartbeat, uptime_gaps,
  anomaly_baseline_compute, anomaly_resolution,
  resolve_alert, acknowledge_alert,
  cooldown_persist: saveCooldown → kill process simulation → loadCooldowns returns same value,
  query_history_max_points: 1000 raw rows with maxPoints=100 → returns exactly 100 points,
  recurring_report_persist: lastRun saved → reload → shouldRun() returns false,
  maintenance_check_suppression: if maintenance_check_url returns active → alert suppressed

test_rate_limiter.cpp:
  10 requests allowed, 11th rejected, loopback exempt,
  allowlist: non-listed IP blocked (socket closed, no response), listed IP allowed,
  evictStale

test_config_validator.cpp: valid config passes, missing TLS cert fails, missing db dir fails

test_self_updater.cpp:
  sha256_correct_hash_passes, sha256_wrong_hash_fails

test_cron_evaluator.cpp:
  All test vectors from CONTEXT.md "Cron Evaluator: Consistent Specification" table.
  "0 2 * * *" matches Mon 02:00, not Mon 02:01.
  "*/5 * * * *" matches :00, :05, :10, not :01.
  "0 0 1,15 * *" matches 1st and 15th, not 2nd.
  Unsupported "L" in DOM field → returns false + logs warning.
```

---

### TASK 12.2 — Frontend Unit Tests

```
Setup: Jest + React Testing Library + jest-environment-jsdom + ts-jest.

lib/__tests__/format.test.ts: all functions + formatSigma, formatHealthScore, parseCronToHuman
lib/__tests__/auth.test.ts: verifyApiKey, isAuthEnabled, key expiry rejection,
  ENOENT on keys.json → returns [] (auth disabled), logs warning, does NOT throw
lib/__tests__/audit.test.ts: IP anonymization (IPv4 last octet zeroed, IPv6 last 64 bits),
  retention days pruning, VPSMON_AUDIT_ENABLED=false skips logging
lib/__tests__/mock.test.ts: seededNoise same serverId = same value, different serverIds = different values,
  getMockHistory respects maxPoints parameter
lib/__tests__/schemas.test.ts: all schemas parse valid data, reject invalid data
lib/__tests__/maintenance.test.ts:
  All cron test vectors from CONTEXT.md table matching test_cron_evaluator.cpp vectors
  (BOTH TypeScript and C++ implementations must pass the same test cases)
  isInMaintenanceWindow with active once window, expired once window, recurring window
  parseCronExpression returns error for L and # syntax
lib/__tests__/silences.test.ts: isMetricSilenced returns true, respects expiresAt
lib/__tests__/share.test.ts: verifyShareToken returns null for expired token
lib/__tests__/annotations.test.ts: atomicWrite creates .tmp file then renames

components/__tests__/CpuPanel.test.tsx
components/__tests__/DiskPanel.test.tsx: prediction badges (90d amber, 14d red, null=none)
components/__tests__/AlertHistory.test.tsx: anomaly sigma tag, maintenance/silence suppressed tags,
  "Silence this metric" button opens dialog, resolved badge
components/__tests__/HealthScore.test.tsx: 100=green, 80=amber, 60=red
components/__tests__/UptimePanel.test.tsx: 99.7% display, period tabs
components/__tests__/CustomWidgetPanel.test.tsx:
  cpu.usage expression works, disks[0].usagePercent array access works,
  division by zero → "—", invalid path → "—", parse error → "ERR"
components/__tests__/SnapshotDiffDialog.test.tsx: delta correct, <5% filtered

hooks/__tests__/useMetrics.test.ts: isPending, isStale, latency history array appends
hooks/__tests__/useLayout.test.ts: all panels in DEFAULT_LAYOUT, widget add/remove
hooks/__tests__/useTheme.test.ts: cycleTheme dark→light→system→dark
hooks/__tests__/IntervalsProvider.test.tsx:
  SSR safety: safeGetIntervals returns {} when typeof window === 'undefined',
  getInterval returns custom after setInterval,
  setInterval updates localStorage
```

---

> **Total tasks: 131**
>
> **Recommended Codex session order:**
> - Session 1:  TASKS 1.1–1.12   — Scaffolding, schemas, types, auth+audit (with ENOENT handling), mock (seeded), all backend helpers (maintenance cron spec, silences, shares)
> - Session 2:  TASKS 2.1–2.6    — Agent core (Makefile with tui+tls targets, SQLite, config with all new fields, logger, signals, main with TLS guard for --update)
> - Session 3:  TASKS 3.1–3.9    — Core collectors + MetricsStore (downsampling + cooldown persistence + health score + maxPoints)
> - Session 4:  TASKS 3.10–3.20  — New collectors (GPU, Docker, FD, DNS, healthchecks, uptime tracker, config watcher, anomaly+resolution, watchdog, maintenance poller, orchestrator)
> - Session 5:  TASKS 4.1–4.8    — Rate limiter+allowlist, TCP server (all commands + maxPoints + TLS guard), TLS, alert channels + cooldown save, recurring reports + persist, config validator, systemd, install
> - Session 6:  TASKS 5.1–5.5    — All API routes (maxPoints forwarding, webhook 503 if no secret, silences, shares, maintenance cron validation)
> - Session 7:  TASKS 6.1–6.4    — Layout shell + history graph
> - Session 8:  TASKS 7.1–7.19   — All 19 panels (alert history with silence button, custom widget with array access + error cases)
> - Session 9:  TASKS 8.1–8.7    — All pages including public share page
> - Session 10: TASKS 9.1–9.7    — Shortcuts, fullscreen, notifications, theme, drag layout, settings (silences + shares + GDPR note + maintenance cron validation), Sentry
> - Session 11: TASKS 10.1–10.3  — Skeletons, errors, formatting utils, responsive audit
> - Session 12: TASKS 11.1–11.7  — CLI flags, self-update (#ifdef VPSMON_TLS), vpsmon-tui (--key + --tls + --light-bg), Docker (WEBHOOK_SECRET in example), next.config, PDF (customizable), README
> - Session 13: TASKS 12.1–12.2  — All tests (same cron test vectors in both C++ and TypeScript, ENOENT auth test, SSR IntervalsProvider test, seededNoise determinism test)
