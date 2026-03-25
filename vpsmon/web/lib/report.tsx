import React from "react";
import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";

export interface ReportOptions {
  sections: string[];
  companyName?: string;
  logoUrl?: string;
  period?: string;
}

type Point = { timestamp?: number; value?: number };
type MaybePointList = Point[] | undefined;

type ReportData = {
  hostname?: string;
  cpu?: { usagePercent?: number; history?: MaybePointList };
  ram?: { usedPercent?: number; peakPercent?: number; history?: MaybePointList };
  disk?: { usedPercent?: number; history?: MaybePointList };
  network?: { totalBandwidthBytes?: number; rxBytes?: number; txBytes?: number; history?: MaybePointList };
  uptime?: { uptimePercent?: number; lastHeartbeatTs?: number; history?: MaybePointList };
  alerts?: { open?: number; total?: number; acknowledged?: number };
  healthchecks?: { passing?: number; failing?: number; total?: number };
  health?: { score?: number; label?: string };
  history?: MaybePointList;
};

const styles = StyleSheet.create({
  page: { backgroundColor: "#FFFFFF", color: "#111827", padding: 32, fontSize: 11, lineHeight: 1.45 },
  title: { fontSize: 20, marginBottom: 8 },
  subtitle: { fontSize: 12, color: "#374151", marginBottom: 3 },
  block: { marginBottom: 14, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 6, padding: 10 },
  blockTitle: { fontSize: 14, marginBottom: 6 },
  row: { display: "flex", flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  label: { color: "#4B5563" },
  value: { color: "#111827" },
  logo: { width: 120, height: 40, objectFit: "contain", marginBottom: 10 },
});

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function avg(points: MaybePointList): number {
  if (!points?.length) return 0;
  return points.reduce((acc, p) => acc + asNumber(p.value), 0) / points.length;
}

function peak(points: MaybePointList): number {
  if (!points?.length) return 0;
  return points.reduce((m, p) => Math.max(m, asNumber(p.value)), 0);
}

function formatPercent(value: number): string {
  return `${Math.max(0, Math.min(100, value)).toFixed(1)}%`;
}

function formatBytes(value: number): string {
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let num = Math.max(0, value);
  let idx = 0;
  while (num >= 1024 && idx < units.length - 1) {
    num /= 1024;
    idx += 1;
  }
  return `${num.toFixed(idx === 0 ? 0 : 2)} ${units[idx]}`;
}

function metricLine(label: string, value: string) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function includesSection(sections: string[], section: string): boolean {
  return sections.includes(section);
}

export async function generateSummaryReport(input: unknown, options: ReportOptions): Promise<Buffer> {
  const data = (input ?? {}) as ReportData;
  const sections = options.sections ?? [];
  const nowText = new Date().toISOString();
  const company = options.companyName ?? data.hostname ?? "VPS";
  const period = options.period ?? "Selected period";

  const cpuPoints = data.cpu?.history ?? data.history;
  const ramPoints = data.ram?.history;
  const diskPoints = data.disk?.history;
  const netPoints = data.network?.history;
  const uptimePoints = data.uptime?.history;

  const summary = {
    avgCpu: asNumber(data.cpu?.usagePercent, avg(cpuPoints)),
    peakRam: asNumber(data.ram?.peakPercent, peak(ramPoints)),
    diskUsage: asNumber(data.disk?.usedPercent, avg(diskPoints)),
    totalBandwidth: asNumber(data.network?.totalBandwidthBytes, asNumber(data.network?.rxBytes) + asNumber(data.network?.txBytes)),
    uptimePercent: asNumber(data.uptime?.uptimePercent, avg(uptimePoints)),
    healthScore: asNumber(data.health?.score, 0),
    healthText: data.health?.label ?? "No status available",
  };

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        {includesSection(sections, "cover") && (
          <View style={styles.block}>
            {!!options.logoUrl && <Image style={styles.logo} src={options.logoUrl} />}
            <Text style={styles.title}>{company} VPS Summary Report</Text>
            <Text style={styles.subtitle}>Period: {period}</Text>
            <Text style={styles.subtitle}>Generated: {nowText}</Text>
          </View>
        )}

        {includesSection(sections, "summary") && (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Executive Summary</Text>
            {metricLine("Average CPU", formatPercent(summary.avgCpu))}
            {metricLine("Peak RAM", formatPercent(summary.peakRam))}
            {metricLine("Disk Usage", formatPercent(summary.diskUsage))}
            {metricLine("Total Bandwidth", formatBytes(summary.totalBandwidth))}
            {metricLine("Uptime", formatPercent(summary.uptimePercent))}
            {metricLine("Health Score", `${summary.healthScore.toFixed(1)} / 100 (${summary.healthText})`)}
          </View>
        )}

        {includesSection(sections, "cpu") && <View style={styles.block}><Text style={styles.blockTitle}>CPU</Text>{metricLine("Current/Avg", formatPercent(summary.avgCpu))}</View>}
        {includesSection(sections, "ram") && <View style={styles.block}><Text style={styles.blockTitle}>RAM</Text>{metricLine("Peak", formatPercent(summary.peakRam))}</View>}
        {includesSection(sections, "disk") && <View style={styles.block}><Text style={styles.blockTitle}>Disk</Text>{metricLine("Used", formatPercent(summary.diskUsage))}</View>}
        {includesSection(sections, "network") && <View style={styles.block}><Text style={styles.blockTitle}>Network</Text>{metricLine("Transferred", formatBytes(summary.totalBandwidth))}</View>}
        {includesSection(sections, "uptime") && <View style={styles.block}><Text style={styles.blockTitle}>Uptime</Text>{metricLine("Availability", formatPercent(summary.uptimePercent))}</View>}
        {includesSection(sections, "alerts") && <View style={styles.block}><Text style={styles.blockTitle}>Alerts</Text>{metricLine("Open", `${asNumber(data.alerts?.open)}`)}{metricLine("Total", `${asNumber(data.alerts?.total)}`)}</View>}
        {includesSection(sections, "healthchecks") && <View style={styles.block}><Text style={styles.blockTitle}>Healthchecks</Text>{metricLine("Passing", `${asNumber(data.healthchecks?.passing)}`)}{metricLine("Failing", `${asNumber(data.healthchecks?.failing)}`)}</View>}
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
