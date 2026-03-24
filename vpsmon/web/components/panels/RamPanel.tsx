"use client";

// RAM metrics panel with usage sparkline and memory composition bar.
// Displays swap usage and total/used memory with monospace formatting.

import { MemoryStick } from "lucide-react";

import { Sparkline } from "@/components/charts/Sparkline";
import { Badge } from "@/components/ui/badge";
import { formatBytes, getThresholdColor } from "@/lib/format";
import { cn } from "@/lib/utils";

interface RamPanelProps {
  usagePercent: number;
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  cachedBytes: number;
  bufferedBytes: number;
  swapUsedBytes: number;
  swapTotalBytes: number;
  history: number[];
}

export function RamPanel(props: RamPanelProps) {
  const usedPct = props.totalBytes > 0 ? (props.usedBytes / props.totalBytes) * 100 : 0;
  const cachePct = props.totalBytes > 0 ? (props.cachedBytes / props.totalBytes) * 100 : 0;
  const buffPct = props.totalBytes > 0 ? (props.bufferedBytes / props.totalBytes) * 100 : 0;

  return (
    <section className="animate-[fadeInUp_0.4s_ease-out] rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <MemoryStick className="h-4 w-4" />
        <span className="text-sm font-medium">RAM</span>
        <Badge className={cn("font-mono", getThresholdColor(props.usagePercent))}>{props.usagePercent.toFixed(1)}%</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-center">
        <Sparkline values={props.history} color="#a78bfa" />
        <div className="font-mono text-3xl font-semibold">{props.usagePercent.toFixed(0)}%</div>
      </div>

      <div className="mt-3 h-3 overflow-hidden rounded bg-muted">
        <div className="h-full bg-emerald-500" style={{ width: `${usedPct}%` }} />
        <div className="-mt-3 h-full bg-cyan-500/80" style={{ width: `${cachePct}%`, marginLeft: `${usedPct}%` }} />
        <div className="-mt-3 h-full bg-amber-500/80" style={{ width: `${buffPct}%`, marginLeft: `${usedPct + cachePct}%` }} />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div>Used <span className="font-mono text-foreground">{formatBytes(props.usedBytes)}</span></div>
        <div>Free <span className="font-mono text-foreground">{formatBytes(props.freeBytes)}</span></div>
        <div>Cached <span className="font-mono text-foreground">{formatBytes(props.cachedBytes)}</span></div>
        <div>Buffered <span className="font-mono text-foreground">{formatBytes(props.bufferedBytes)}</span></div>
      </div>

      <div className="mt-2 text-xs text-muted-foreground">Swap <span className="font-mono text-foreground">{formatBytes(props.swapUsedBytes)} / {formatBytes(props.swapTotalBytes)}</span></div>
    </section>
  );
}
