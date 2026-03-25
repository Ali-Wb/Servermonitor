"use client";

import { TriangleAlert } from "lucide-react";

import type { FdMetrics } from "@/lib/schemas";

interface FdPanelProps {
  fd: FdMetrics;
}

export function FdPanel({ fd }: FdPanelProps) {
  const pct = fd.limit > 0 ? (fd.open / fd.limit) * 100 : fd.usagePercent;

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium">File Descriptors</h3>
        <span title="High FD usage can cause accept/socket failures." className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <TriangleAlert className="h-3 w-3" /> Warning
        </span>
      </div>
      <div className="font-mono text-2xl font-semibold">{fd.open} / {fd.limit}</div>
      <div className="text-xs text-muted-foreground">{pct.toFixed(1)}%</div>
      <div className="mt-2 h-2 rounded bg-muted">
        <div className={pct >= 90 ? "h-2 rounded bg-red-500" : pct >= 75 ? "h-2 rounded bg-amber-500" : "h-2 rounded bg-emerald-500"} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      </div>
      <div className="mt-3">
        <h4 className="mb-1 text-xs font-medium">Top consumers</h4>
        <table className="w-full text-left text-xs">
          <thead className="text-muted-foreground"><tr><th>PID</th><th>Name</th><th>Open</th></tr></thead>
          <tbody>
            {fd.topConsumers.map((c) => (
              <tr key={c.pid} className="border-t"><td className="py-1 font-mono">{c.pid}</td><td>{c.name}</td><td className="font-mono">{c.openCount}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
