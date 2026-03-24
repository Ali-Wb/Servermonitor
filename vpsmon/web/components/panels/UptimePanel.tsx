"use client";

import { useState } from "react";

import { useUptimeData } from "@/hooks/useMetrics";

interface UptimePanelProps { serverId: string }

const PERIODS = ["day", "week", "month"] as const;

export function UptimePanel({ serverId }: UptimePanelProps) {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("day");
  const { data } = useUptimeData(serverId, period);

  const pct = data?.uptimePercent ?? 0;
  const pctClass = pct >= 99.9 ? "text-emerald-500" : pct >= 99 ? "text-amber-500" : "text-red-500";
  const periodEnd = Date.now();
  const periodStart = data ? periodEnd - data.expectedSeconds * 1000 : periodEnd;

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-2 flex gap-1">{PERIODS.map((p) => <button type="button" key={p} className={`rounded border px-2 py-1 text-xs ${p === period ? "bg-muted" : ""}`} onClick={() => setPeriod(p)}>{p}</button>)}</div>
      <div className={`font-mono text-4xl font-semibold ${pctClass}`}>{pct.toFixed(3)}%</div>
      <div className="relative mt-3 h-3 overflow-hidden rounded bg-emerald-500/70">
        {data?.gaps.map((gap, index) => {
          const start = ((gap.start - periodStart) / Math.max(1, data.expectedSeconds * 1000)) * 100;
          const end = ((gap.end - periodStart) / Math.max(1, data.expectedSeconds * 1000)) * 100;
          const left = Math.max(0, Math.min(100, start));
          const right = Math.max(0, Math.min(100, end));
          const width = Math.max(0.5, right - left);
          return <div key={index} className="absolute top-0 h-3 bg-red-500" style={{ left: `${left}%`, width: `${width}%` }} />;
        })}
      </div>
    </section>
  );
}
