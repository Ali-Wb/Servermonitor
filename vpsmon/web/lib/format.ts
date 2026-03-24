// Formatting helpers for numeric metric display.
// Provides semantic threshold color selection and byte/rate conversion
// for dashboard panels without embedding formatting logic in components.

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
