"use client";

// Disk usage panel rendering per-mount utilization, throughput, and latency.
// Includes days-to-full prediction badges with amber/red risk thresholds.

import { HardDrive } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatBytes, formatRate } from "@/lib/format";

interface DiskMountView {
  mountpoint: string;
  usagePercent: number;
  usedBytes: number;
  totalBytes: number;
  readBytesPerSecond: number;
  writeBytesPerSecond: number;
  ioLatencyMs?: number | null;
  daysUntilFull?: number | null;
}

interface DiskPanelProps {
  mounts: DiskMountView[];
}

function predictionBadge(daysUntilFull?: number | null) {
  if (daysUntilFull == null || !Number.isFinite(daysUntilFull) || daysUntilFull < 0) return null;
  if (daysUntilFull < 14) return <Badge className="bg-red-600 text-white">{Math.round(daysUntilFull)}d to full</Badge>;
  if (daysUntilFull < 90) return <Badge className="bg-amber-500 text-black">{Math.round(daysUntilFull)}d to full</Badge>;
  return <Badge>{Math.round(daysUntilFull)}d to full</Badge>;
}

export function DiskPanel({ mounts }: DiskPanelProps) {
  return (
    <section className="animate-[fadeInUp_0.45s_ease-out] rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <HardDrive className="h-4 w-4" />
        <span className="text-sm font-medium">Disks</span>
      </div>

      <div className="space-y-4">
        {mounts.map((mount) => (
          <article key={mount.mountpoint} className="rounded-md border p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="font-mono text-sm">{mount.mountpoint}</div>
              <div className="flex items-center gap-2" title="Prediction uses linear regression over recent usage trend.">
                <span className="font-mono text-sm">{mount.usagePercent.toFixed(1)}%</span>
                {predictionBadge(mount.daysUntilFull)}
              </div>
            </div>

            <div className="h-2 rounded bg-muted">
              <div className={mount.usagePercent >= 90 ? "h-2 rounded bg-red-500" : mount.usagePercent >= 75 ? "h-2 rounded bg-amber-500" : "h-2 rounded bg-emerald-500"} style={{ width: `${Math.min(100, Math.max(0, mount.usagePercent))}%` }} />
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground md:grid-cols-4">
              <div>Used <span className="font-mono text-foreground">{formatBytes(mount.usedBytes)} / {formatBytes(mount.totalBytes)}</span></div>
              <div>Read <span className="font-mono text-foreground">{formatRate(mount.readBytesPerSecond)}</span></div>
              <div>Write <span className="font-mono text-foreground">{formatRate(mount.writeBytesPerSecond)}</span></div>
              <div>Latency <span className="font-mono text-foreground">{mount.ioLatencyMs == null ? "—" : `${mount.ioLatencyMs.toFixed(2)}ms`}</span></div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
