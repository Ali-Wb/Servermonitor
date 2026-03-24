#include "alerts/recurring_report_scheduler.hpp"

#include "alerts/channels/channel.hpp"

#include <algorithm>
#include <chrono>
#include <ctime>
#include <sstream>
#include <string>
#include <unistd.h>
#include <vector>

namespace {

int64_t nowMs() {
    return std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::system_clock::now().time_since_epoch()).count();
}

std::vector<std::string> splitCsv(const std::string& value) {
    std::vector<std::string> parts;
    std::stringstream stream(value);
    std::string token;
    while (std::getline(stream, token, ',')) {
        std::size_t a = token.find_first_not_of(" \t\n\r");
        std::size_t b = token.find_last_not_of(" \t\n\r");
        if (a != std::string::npos) parts.push_back(token.substr(a, b - a + 1));
    }
    return parts;
}

bool scheduleMatches(const std::string& schedule, const std::tm& tm) {
    if (schedule.empty() || schedule == "daily") {
        return tm.tm_hour == 9 && tm.tm_min == 0;
    }
    if (schedule.rfind("daily@", 0) == 0) {
        const std::string hm = schedule.substr(6);
        const int hh = hm.size() >= 2 ? std::stoi(hm.substr(0, 2)) : 9;
        const int mm = hm.size() >= 5 ? std::stoi(hm.substr(3, 2)) : 0;
        return tm.tm_hour == hh && tm.tm_min == mm;
    }
    std::stringstream ss(schedule);
    std::string minute, hour;
    ss >> minute >> hour;
    const bool mOk = (minute == "*" || std::stoi(minute) == tm.tm_min);
    const bool hOk = (hour == "*" || std::stoi(hour) == tm.tm_hour);
    return mOk && hOk;
}

std::string hostName() {
    char buffer[256] = {0};
    if (gethostname(buffer, sizeof(buffer) - 1) == 0) return std::string(buffer);
    return "unknown-host";
}

}  // namespace

RecurringReportScheduler::RecurringReportScheduler(const AgentConfig& config, MetricsStore& store)
    : config_(config),
      store_(store) {
    lastRunMs_ = store_.loadSchedulerState("recurring_report");
}

void RecurringReportScheduler::updateConfig(const AgentConfig& config) {
    config_ = config;
}

bool RecurringReportScheduler::shouldRun(int64_t now) const {
    if (!config_.recurring_reports_enabled) return false;
    if ((now - lastRunMs_) < 23LL * 60LL * 60LL * 1000LL) return false;
    std::time_t nowSec = static_cast<std::time_t>(now / 1000);
    std::tm localTm{};
    localtime_r(&nowSec, &localTm);
    return scheduleMatches(config_.recurring_reports_schedule, localTm);
}

std::string RecurringReportScheduler::buildHtmlReport(int periodDays) const {
    const int64_t fromTs = nowMs() - static_cast<int64_t>(periodDays) * 24LL * 60LL * 60LL * 1000LL;
    const auto cpu = store_.queryHistory("cpu.usage_percent", fromTs, 500);
    const auto ram = store_.queryHistory("ram.used_percent", fromTs, 500);
    const auto alerts = store_.queryAlerts(500);

    double cpuAvg = 0.0;
    for (const auto& p : cpu) cpuAvg += p.second;
    if (!cpu.empty()) cpuAvg /= static_cast<double>(cpu.size());

    double ramPeak = 0.0;
    for (const auto& p : ram) ramPeak = std::max(ramPeak, p.second);

    std::ostringstream html;
    html << "<html><body style='font-family:Arial,sans-serif;background:#0b1220;color:#e5e7eb;'>";
    html << "<table width='100%' cellpadding='8' cellspacing='0' style='border-collapse:collapse;'>";
    html << "<tr style='background:#111827;color:#93c5fd;'><td colspan='2'><b>VPS Health Report</b></td></tr>";
    html << "<tr><td style='border:1px solid #1f2937;'>Hostname</td><td style='border:1px solid #1f2937;'>" << hostName() << "</td></tr>";
    html << "<tr><td style='border:1px solid #1f2937;'>Period</td><td style='border:1px solid #1f2937;'>Last " << periodDays << " day(s)</td></tr>";
    html << "<tr><td style='border:1px solid #1f2937;'>Avg CPU</td><td style='border:1px solid #1f2937;color:#34d399;'>" << cpuAvg << "%</td></tr>";
    html << "<tr><td style='border:1px solid #1f2937;'>Peak RAM</td><td style='border:1px solid #1f2937;color:#f59e0b;'>" << ramPeak << "%</td></tr>";
    html << "<tr><td style='border:1px solid #1f2937;'>Alert Count</td><td style='border:1px solid #1f2937;color:#f87171;'>" << alerts.size() << "</td></tr>";
    html << "<tr><td style='border:1px solid #1f2937;'>Healthchecks</td><td style='border:1px solid #1f2937;'>Summary available in agent snapshot endpoint</td></tr>";
    html << "</table></body></html>";
    return html.str();
}

void RecurringReportScheduler::tick() {
    const int64_t now = nowMs();
    if ((now - lastTickCheckMs_) < 60000) return;
    lastTickCheckMs_ = now;

    if (!shouldRun(now)) return;

    lastRunMs_ = now;
    store_.saveSchedulerState("recurring_report", lastRunMs_);

    AlertMessage msg;
    msg.severity = "info";
    msg.subject = "VPS Health Report: " + hostName() + " — last " + std::to_string(config_.recurring_reports_period_days) + " day(s)";
    msg.htmlBody = buildHtmlReport(config_.recurring_reports_period_days);
    msg.body = "Recurring VPS report attached as HTML body";

    for (const std::string& recipient : splitCsv(config_.recurring_reports_recipients)) {
        msg.recipient = recipient;
        (void)sendSmtp(config_, msg);
    }
}
