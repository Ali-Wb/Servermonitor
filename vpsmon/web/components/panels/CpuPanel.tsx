"use client";

// CPU metrics card with usage badge, sparkline, thermals, and per-core bars.
// Designed to be drag-layout friendly by exposing a visible grip handle.
// Uses semantic threshold classes and monospace numeric rendering.

import { Cpu, GripVertical } from "lucide-react";

import { Sparkline } from "@/components/charts/Sparkline";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getThresholdColor } from "@/lib/format";

interface CpuCoreView {
  id: number;
  label: string;
  usagePercent: number;
}

interface CpuPanelProps {
  usagePercent: number;
  temperatureCelsius?: number | null;
  loadAvg1: number;
  loadAvg5: number;
  loadAvg15: number;
  cores: CpuCoreView[];
  history: number[];
}

export function CpuPanel({ usagePercent, temperatureCelsius, loadAvg1, loadAvg5, loadAvg15, cores, history }: CpuPanelProps) {
  return (
    <section className="animate-[fadeInUp_0.35s_ease-out] rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4" />
          <span className="text-sm font-medium">CPU</span>
          <Badge className={cn("font-mono", getThresholdColor(usagePercent))}>{usagePercent.toFixed(1)}%</Badge>
        </div>
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-center">
        <Sparkline values={history} />
        <div className={cn("text-right font-mono text-4xl font-semibold", getThresholdColor(usagePercent))}>{usagePercent.toFixed(0)}%</div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
        <div>Temp <span className="font-mono text-foreground">{temperatureCelsius == null ? "—" : `${temperatureCelsius.toFixed(1)}°C`}</span></div>
        <div>Load 1m <span className="font-mono text-foreground">{loadAvg1.toFixed(2)}</span></div>
        <div>Load 5/15m <span className="font-mono text-foreground">{loadAvg5.toFixed(2)} / {loadAvg15.toFixed(2)}</span></div>
      </div>

      <div className="mt-3 space-y-2">
        {cores.map((core) => (
          <div key={core.id} className="grid grid-cols-[52px_1fr_48px] items-center gap-2 text-xs">
            <span className="font-mono text-muted-foreground">{core.label}</span>
            <div className="h-2 rounded bg-muted">
              <div className={cn("h-2 rounded", core.usagePercent >= 90 ? "bg-red-500" : core.usagePercent >= 75 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${Math.min(100, Math.max(0, core.usagePercent))}%` }} />
            </div>
            <span className="font-mono text-right">{core.usagePercent.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}
