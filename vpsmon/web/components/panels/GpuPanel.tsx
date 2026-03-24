"use client";

import { BadgeCheck, Cpu } from "lucide-react";

import { Sparkline } from "@/components/charts/Sparkline";
import { Badge } from "@/components/ui/badge";
import { formatBytes, getThresholdColor } from "@/lib/format";
import type { GpuMetrics } from "@/lib/schemas";
import { cn } from "@/lib/utils";

interface GpuPanelProps {
  gpus: GpuMetrics[];
  history?: number[];
}

export function GpuPanel({ gpus, history = [] }: GpuPanelProps) {
  if (gpus.length === 0) {
    return (
      <section className="rounded-lg border bg-card p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <Cpu className="h-4 w-4" />
          GPU
        </div>
        <p className="text-sm text-muted-foreground">No GPU metrics available.</p>
      </section>
    );
  }

  const primary = gpus[0];
  const memoryPct = primary.memoryTotalBytes > 0 ? (primary.memoryUsedBytes / primary.memoryTotalBytes) * 100 : 0;

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4" />
          <span className="text-sm font-medium">GPU</span>
          <Badge className="capitalize">{primary.vendor}</Badge>
        </div>
        <Badge className={cn("font-mono", getThresholdColor(primary.usagePercent))}>{primary.usagePercent.toFixed(0)}%</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-center">
        <Sparkline values={history.length > 0 ? history : [primary.usagePercent]} color="#60a5fa" />
        <div className={cn("font-mono text-3xl font-semibold", getThresholdColor(primary.usagePercent))}>{primary.usagePercent.toFixed(0)}%</div>
      </div>

      <div className="mt-3 h-2 rounded bg-muted">
        <div className="h-2 rounded bg-blue-500" style={{ width: `${Math.max(0, Math.min(100, memoryPct))}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-mono">VRAM {formatBytes(primary.memoryUsedBytes)} / {formatBytes(primary.memoryTotalBytes)}</span>
        <span className="inline-flex items-center gap-1"><BadgeCheck className="h-3 w-3" />{primary.model}</span>
      </div>
    </section>
  );
}
