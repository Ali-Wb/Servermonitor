#include "storage/metrics_store.hpp"

#include <algorithm>
#include <chrono>
#include <filesystem>
#include <ctime>
#include <sstream>
#include <stdexcept>

namespace {

int64_t nowMs() {
    const auto now = std::chrono::time_point_cast<std::chrono::milliseconds>(
        std::chrono::system_clock::now()
    );
    return now.time_since_epoch().count();
}

int64_t toInt64(const std::string& value) {
    return value.empty() ? 0 : std::stoll(value);
}

double toDouble(const std::string& value) {
    return value.empty() ? 0.0 : std::stod(value);
}

}  // namespace

MetricsStore::MetricsStore(std::string dbPath)
    : dbPath_(std::move(dbPath)),
      db_(nullptr) {
}

bool MetricsStore::init() {
    db_ = std::make_unique<Database>(dbPath_);
    createSchema();
    return checkAndRepairDatabase();
}

bool MetricsStore::checkAndRepairDatabase() {
    ensureOpen();

    if (db_->integrityCheck()) {
        return true;
    }

    db_.reset();

    const int64_t timestamp = nowMs();
    const std::string corruptPath = dbPath_ + ".corrupt." + std::to_string(timestamp);

    std::error_code ec;
    std::filesystem::rename(dbPath_, corruptPath, ec);

    db_ = std::make_unique<Database>(dbPath_);
    createSchema();
    return false;
}

void MetricsStore::createSchema() {
    ensureOpen();

    db_->exec(
        "CREATE TABLE IF NOT EXISTS metrics_raw("
        "id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "timestamp INTEGER,"
        "metric TEXT,"
        "value REAL"
        ");"
    );
    db_->exec("CREATE INDEX IF NOT EXISTS idx_metrics_raw_metric_ts ON metrics_raw(metric, timestamp);");

    db_->exec(
        "CREATE TABLE IF NOT EXISTS metrics_1min("
        "id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "timestamp INTEGER,"
        "metric TEXT,"
        "value REAL"
        ");"
    );
    db_->exec("CREATE INDEX IF NOT EXISTS idx_metrics_1min_metric_ts ON metrics_1min(metric, timestamp);");

    db_->exec(
        "CREATE TABLE IF NOT EXISTS metrics_5min("
        "id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "timestamp INTEGER,"
        "metric TEXT,"
        "value REAL"
        ");"
    );
    db_->exec("CREATE INDEX IF NOT EXISTS idx_metrics_5min_metric_ts ON metrics_5min(metric, timestamp);");

    db_->exec(
        "CREATE TABLE IF NOT EXISTS metrics_1hour("
        "id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "timestamp INTEGER,"
        "metric TEXT,"
        "value REAL"
        ");"
    );
    db_->exec("CREATE INDEX IF NOT EXISTS idx_metrics_1hour_metric_ts ON metrics_1hour(metric, timestamp);");

    db_->exec(
        "CREATE TABLE IF NOT EXISTS anomaly_baseline("
        "metric TEXT,"
        "hour INTEGER,"
        "mean REAL,"
        "stddev REAL,"
        "computed_at INTEGER,"
        "PRIMARY KEY(metric, hour)"
        ");"
    );

    db_->exec(
        "CREATE TABLE IF NOT EXISTS uptime_log("
        "id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "timestamp INTEGER,"
        "status TEXT"
        ");"
    );

    db_->exec(
        "CREATE TABLE IF NOT EXISTS alerts("
        "id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "timestamp INTEGER,"
        "metric TEXT,"
        "value REAL,"
        "threshold REAL,"
        "message TEXT,"
        "severity TEXT,"
        "resolved_at INTEGER DEFAULT 0,"
        "acknowledged INTEGER DEFAULT 0,"
        "acknowledged_by TEXT,"
        "acknowledged_at INTEGER,"
        "is_anomaly INTEGER DEFAULT 0,"
        "anomaly_sigma REAL DEFAULT 0.0"
        ");"
    );

    db_->exec(
        "CREATE TABLE IF NOT EXISTS bandwidth("
        "id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "date TEXT,"
        "interface TEXT,"
        "rx_bytes INTEGER,"
        "tx_bytes INTEGER"
        ");"
    );

    db_->exec(
        "CREATE TABLE IF NOT EXISTS downsampler_state("
        "metric TEXT PRIMARY KEY,"
        "last_1min_ts INTEGER,"
        "last_5min_ts INTEGER,"
        "last_1hour_ts INTEGER"
        ");"
    );

    db_->exec(
        "CREATE TABLE IF NOT EXISTS alert_cooldowns("
        "metric TEXT PRIMARY KEY,"
        "last_fired_ms INTEGER NOT NULL"
        ");"
    );
    db_->exec(
        "CREATE TABLE IF NOT EXISTS api_keys("
        "key_hash TEXT PRIMARY KEY,"
        "created_at INTEGER"
        ");"
    );
}

void MetricsStore::ensureOpen() const {
    if (!db_) {
        throw std::runtime_error("MetricsStore database is not initialized");
    }
}

void MetricsStore::writeMetric(const std::string& metric, double value, int64_t timestampMs) {
    ensureOpen();

    const int64_t ts = timestampMs > 0 ? timestampMs : nowMs();
    db_->exec(
        "INSERT INTO metrics_raw(timestamp, metric, value) VALUES(?, ?, ?);",
        {std::to_string(ts), metric, std::to_string(value)}
    );
}

std::string MetricsStore::pickTierTable(int64_t fromTs, int64_t nowTs) const {
    const int64_t ageMs = nowTs - fromTs;
    constexpr int64_t kHour = 60LL * 60LL * 1000LL;
    constexpr int64_t kDay = 24LL * kHour;

    if (ageMs <= 6LL * kHour) {
        return "metrics_raw";
    }
    if (ageMs <= 2LL * kDay) {
        return "metrics_1min";
    }
    if (ageMs <= 14LL * kDay) {
        return "metrics_5min";
    }
    return "metrics_1hour";
}

std::vector<std::pair<int64_t, double>> MetricsStore::applyBucketDownsample(
    const std::vector<HistoryPoint>& input,
    int64_t fromTs,
    int64_t nowTs,
    int maxPoints
) const {
    if (maxPoints <= 0 || static_cast<int>(input.size()) <= maxPoints || nowTs <= fromTs) {
        std::vector<std::pair<int64_t, double>> passthrough;
        passthrough.reserve(input.size());
        for (const HistoryPoint& point : input) {
            passthrough.emplace_back(point.ts, point.value);
        }
        return passthrough;
    }

    struct Bucket {
        double sum = 0.0;
        int count = 0;
    };

    const double width = static_cast<double>(nowTs - fromTs) / static_cast<double>(maxPoints);
    std::vector<Bucket> buckets(static_cast<std::size_t>(maxPoints));

    for (const HistoryPoint& point : input) {
        int bucketIndex = static_cast<int>((static_cast<double>(point.ts - fromTs)) / width);
        bucketIndex = std::clamp(bucketIndex, 0, maxPoints - 1);
        buckets[static_cast<std::size_t>(bucketIndex)].sum += point.value;
        buckets[static_cast<std::size_t>(bucketIndex)].count += 1;
    }

    std::vector<std::pair<int64_t, double>> downsampled;
    downsampled.reserve(static_cast<std::size_t>(maxPoints));

    for (int idx = 0; idx < maxPoints; ++idx) {
        const Bucket& bucket = buckets[static_cast<std::size_t>(idx)];
        if (bucket.count == 0) {
            continue;
        }

        const int64_t midpoint = fromTs + static_cast<int64_t>((idx + 0.5) * width);
        downsampled.emplace_back(midpoint, bucket.sum / static_cast<double>(bucket.count));
    }

    return downsampled;
}

std::vector<std::pair<int64_t, double>> MetricsStore::queryHistory(
    const std::string& metric,
    int64_t fromTs,
    int maxPoints
) const {
    ensureOpen();

    const int64_t nowTs = nowMs();
    const std::string tier = pickTierTable(fromTs, nowTs);

    const Database::QueryResult rows = db_->query(
        "SELECT timestamp, value FROM " + tier + " WHERE metric = ? AND timestamp >= ? ORDER BY timestamp ASC;",
        {metric, std::to_string(fromTs)}
    );

    std::vector<HistoryPoint> parsed;
    parsed.reserve(rows.size());

    for (const Database::Row& row : rows) {
        const auto tsIt = row.find("timestamp");
        const auto valueIt = row.find("value");

        if (tsIt == row.end() || valueIt == row.end()) {
            continue;
        }

        parsed.push_back({toInt64(tsIt->second), toDouble(valueIt->second)});
    }

    return applyBucketDownsample(parsed, fromTs, nowTs, maxPoints);
}

void MetricsStore::saveCooldown(const std::string& metric, int64_t lastFiredMs) {
    ensureOpen();

    db_->exec(
        "INSERT INTO alert_cooldowns(metric, last_fired_ms) VALUES(?, ?) "
        "ON CONFLICT(metric) DO UPDATE SET last_fired_ms=excluded.last_fired_ms;",
        {metric, std::to_string(lastFiredMs)}
    );
}

std::map<std::string, int64_t> MetricsStore::loadCooldowns() const {
    ensureOpen();

    const Database::QueryResult rows = db_->query(
        "SELECT metric, last_fired_ms FROM alert_cooldowns;"
    );

    std::map<std::string, int64_t> cooldowns;
    for (const Database::Row& row : rows) {
        const auto metricIt = row.find("metric");
        const auto firedIt = row.find("last_fired_ms");
        if (metricIt == row.end() || firedIt == row.end()) {
            continue;
        }
        cooldowns[metricIt->second] = toInt64(firedIt->second);
    }

    return cooldowns;
}

std::vector<AlertRow> MetricsStore::queryAlerts(int limit) const {
    ensureOpen();
    const int safeLimit = std::clamp(limit, 1, 500);
    const Database::QueryResult rows = db_->query(
        "SELECT id,timestamp,metric,value,threshold,message,severity,resolved_at,acknowledged,acknowledged_by,"
        "acknowledged_at,is_anomaly,anomaly_sigma FROM alerts ORDER BY timestamp DESC LIMIT ?;",
        {std::to_string(safeLimit)}
    );
    std::vector<AlertRow> out;
    out.reserve(rows.size());
    for (const auto& row : rows) {
        AlertRow a;
        a.id = static_cast<int>(toInt64(row.at("id")));
        a.timestamp = toInt64(row.at("timestamp"));
        a.metric = row.at("metric");
        a.value = toDouble(row.at("value"));
        a.threshold = toDouble(row.at("threshold"));
        a.message = row.at("message");
        a.severity = row.at("severity");
        a.resolved_at = toInt64(row.at("resolved_at"));
        a.acknowledged = toInt64(row.at("acknowledged")) != 0;
        a.acknowledged_by = row.at("acknowledged_by");
        a.acknowledged_at = toInt64(row.at("acknowledged_at"));
        a.is_anomaly = toInt64(row.at("is_anomaly")) != 0;
        a.anomaly_sigma = toDouble(row.at("anomaly_sigma"));
        out.push_back(a);
    }
    return out;
}

bool MetricsStore::resolveAlert(int alertId, int64_t resolvedAtMs) {
    ensureOpen();
    db_->exec(
        "UPDATE alerts SET resolved_at=? WHERE id=?;",
        {std::to_string(resolvedAtMs), std::to_string(alertId)}
    );
    return true;
}

bool MetricsStore::acknowledgeAlert(int alertId, const std::string& acknowledgedBy, int64_t acknowledgedAtMs) {
    ensureOpen();
    const int64_t ts = acknowledgedAtMs > 0 ? acknowledgedAtMs : nowMs();
    db_->exec(
        "UPDATE alerts SET acknowledged=1, acknowledged_by=?, acknowledged_at=? WHERE id=?;",
        {acknowledgedBy, std::to_string(ts), std::to_string(alertId)}
    );
    return true;
}

UptimeStats MetricsStore::queryUptime(const std::string& period) const {
    ensureOpen();
    const int64_t nowTs = nowMs();
    int64_t fromTs = nowTs - 24LL * 60LL * 60LL * 1000LL;
    if (period == "7d") fromTs = nowTs - 7LL * 24LL * 60LL * 60LL * 1000LL;
    else if (period == "30d") fromTs = nowTs - 30LL * 24LL * 60LL * 60LL * 1000LL;
    const Database::QueryResult rows = db_->query(
        "SELECT timestamp,status FROM uptime_log WHERE timestamp>=? ORDER BY timestamp ASC;",
        {std::to_string(fromTs)}
    );
    UptimeStats stats;
    stats.period = period.empty() ? "24h" : period;
    stats.expectedSeconds = (nowTs - fromTs) / 1000;
    int64_t upRows = 0;
    for (const auto& row : rows) {
        if (row.at("status") == "up") upRows++;
    }
    stats.uptimeSeconds = upRows * 60;
    stats.uptimePercent = stats.expectedSeconds > 0
        ? (100.0 * static_cast<double>(stats.uptimeSeconds) / static_cast<double>(stats.expectedSeconds))
        : 0.0;
    return stats;
}

void MetricsStore::updateAnomalyBaseline() {
    ensureOpen();
    std::time_t now = std::time(nullptr);
    std::tm* gmt = std::gmtime(&now);
    const int hour = gmt != nullptr ? gmt->tm_hour : 0;
    const int64_t tsMs = nowMs();
    const Database::QueryResult metrics = db_->query("SELECT DISTINCT metric FROM metrics_raw;");
    for (const auto& row : metrics) {
        const std::string metric = row.at("metric");
        db_->exec(
            "INSERT INTO anomaly_baseline(metric,hour,mean,stddev,computed_at) "
            "SELECT ?, ?, COALESCE(AVG(value),0), COALESCE(STDDEV(value),0), ? FROM metrics_raw WHERE metric=? "
            "ON CONFLICT(metric,hour) DO UPDATE SET mean=excluded.mean,stddev=excluded.stddev,computed_at=excluded.computed_at;",
            {metric, std::to_string(hour), std::to_string(tsMs), metric}
        );
    }
}

void MetricsStore::aggregateAndPrune(
    const std::string& sourceTable,
    const std::string& targetTable,
    const std::string& stateColumn,
    int64_t windowMs,
    const std::string& metric
) {
    ensureOpen();

    db_->beginTransaction();
    try {
        db_->exec(
            "INSERT INTO downsampler_state(metric, last_1min_ts, last_5min_ts, last_1hour_ts) "
            "VALUES(?, 0, 0, 0) ON CONFLICT(metric) DO NOTHING;",
            {metric}
        );

        const Database::QueryResult stateRows = db_->query(
            "SELECT " + stateColumn + " FROM downsampler_state WHERE metric = ?;",
            {metric}
        );

        int64_t lastTs = 0;
        if (!stateRows.empty()) {
            const auto it = stateRows.front().find(stateColumn);
            if (it != stateRows.front().end()) {
                lastTs = toInt64(it->second);
            }
        }

        const std::ostringstream querySql;
        (void)querySql;

        const Database::QueryResult aggregates = db_->query(
            "SELECT ((timestamp / ?) * ?) AS bucket_ts, AVG(value) AS avg_value, MAX(timestamp) AS max_ts "
            "FROM " + sourceTable + " WHERE metric = ? AND timestamp > ? "
            "GROUP BY bucket_ts ORDER BY bucket_ts ASC;",
            {std::to_string(windowMs), std::to_string(windowMs), metric, std::to_string(lastTs)}
        );

        int64_t processedUntil = lastTs;
        for (const Database::Row& row : aggregates) {
            const int64_t bucketTs = toInt64(row.at("bucket_ts"));
            const double avgValue = toDouble(row.at("avg_value"));
            const int64_t maxTs = toInt64(row.at("max_ts"));

            db_->exec(
                "INSERT INTO " + targetTable + "(timestamp, metric, value) VALUES(?, ?, ?);",
                {std::to_string(bucketTs), metric, std::to_string(avgValue)}
            );

            processedUntil = std::max(processedUntil, maxTs);
        }

        db_->exec(
            "UPDATE downsampler_state SET " + stateColumn + " = ? WHERE metric = ?;",
            {std::to_string(processedUntil), metric}
        );

        // Crash-safe ordering: aggregated writes happened before this prune.
        db_->exec(
            "DELETE FROM " + sourceTable + " WHERE metric = ? AND timestamp <= ?;",
            {metric, std::to_string(processedUntil)}
        );

        db_->commit();
    } catch (...) {
        db_->rollback();
        throw;
    }
}

void MetricsStore::runDownsamplerOnce(const std::string& metric) {
    aggregateAndPrune("metrics_raw", "metrics_1min", "last_1min_ts", 60LL * 1000LL, metric);
    aggregateAndPrune("metrics_1min", "metrics_5min", "last_5min_ts", 5LL * 60LL * 1000LL, metric);
    aggregateAndPrune("metrics_5min", "metrics_1hour", "last_1hour_ts", 60LL * 60LL * 1000LL, metric);
}
