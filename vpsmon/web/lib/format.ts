"use client";

// Formatting helpers for numeric metric display.
// Provides semantic threshold color selection and byte/rate conversion
// for dashboard panels without embedding formatting logic in components.
import cronstrue from "cronstrue";

import { useIntervals } from "@/providers/IntervalsProvider";

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[unit]}`;
}

export function formatRate(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`;
}

export function getThresholdColor(value: number, warn: number = 75, crit: number = 90): string {
  if (value >= crit) return "text-destructive";
  if (value >= warn) return "text-amber-500";
  return "text-emerald-500";
}

export function formatSigma(z: number): string {
  if (!Number.isFinite(z)) return "—";
  return `${z.toFixed(1)}σ`;
}

export function formatHealthScore(score: number): { label: string; color: string } {
  if (score >= 90) return { label: "Excellent", color: "text-emerald-500" };
  if (score >= 70) return { label: "Warning", color: "text-amber-500" };
  return { label: "Critical", color: "text-red-500" };
}

export function parseCronToHuman(cron: string): string {
  try {
    return cronstrue.toString(cron);
  } catch {
    return "Invalid cron schedule";
  }
}

export function formatCronSchedule(schedule: string): string {
  if (schedule.startsWith("cron:")) {
    return parseCronToHuman(schedule.slice(5).trim());
  }
  if (schedule.startsWith("once:")) {
    const timestamp = Number(schedule.slice(5));
    if (!Number.isFinite(timestamp)) return "Invalid one-time schedule";
    return `One-time: ${new Date(timestamp).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`;
  }
  return schedule;
}

export const WELL_KNOWN_PORTS: Record<number, string> = {
  22: "SSH",
  25: "SMTP",
  53: "DNS",
  80: "HTTP",
  110: "POP3",
  123: "NTP",
  143: "IMAP",
  443: "HTTPS",
  465: "SMTPS",
  587: "Submission",
  6379: "Redis",
  9092: "Kafka",
  9200: "Elasticsearch",
  9300: "Elasticsearch Transport",
  15672: "RabbitMQ Mgmt",
  5672: "RabbitMQ",
  3306: "MySQL",
  5432: "PostgreSQL",
  27017: "MongoDB",
};

export function getPanelInterval(panelId: string, defaultMs: number): number {
  const { getInterval } = useIntervals();
  return getInterval(panelId, defaultMs);
}
