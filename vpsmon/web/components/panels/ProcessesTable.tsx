"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import type { Process } from "@/lib/schemas";

interface ProcessesTableProps { processes: Process[] }
type SortKey = "cpuPercent" | "memoryPercent" | "pid";

export function ProcessesTable({ processes }: ProcessesTableProps) {
  const [sortBy, setSortBy] = useState<SortKey>("cpuPercent");
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState(false);

  const rows = useMemo(() => {
    const normalized = filter.trim().toLowerCase();
    const filtered = normalized.length > 0
      ? processes.filter((p) => p.name.toLowerCase().includes(normalized) || String(p.pid).includes(normalized))
      : processes;
    return [...filtered].sort((a, b) => b[sortBy] - a[sortBy]);
  }, [filter, processes, sortBy]);

  const visible = expanded ? rows : rows.slice(0, 15);

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Processes</h3>
        <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter by name or PID" className="h-8 rounded border bg-background px-2 text-xs" />
      </div>
      <div className="mb-2 flex gap-1 text-xs">
        {(["cpuPercent", "memoryPercent", "pid"] as const).map((key) => (
          <button type="button" key={key} className={`rounded border px-2 py-1 ${sortBy === key ? "bg-muted" : ""}`} onClick={() => setSortBy(key)}>{key}</button>
        ))}
      </div>
      <table className="w-full text-left text-xs">
        <thead className="text-muted-foreground"><tr><th>PID</th><th>Name</th><th>CPU%</th><th>Mem%</th><th>State</th></tr></thead>
        <tbody>
          {visible.map((p) => (
            <tr key={p.pid} className="border-t"><td className="py-1 font-mono">{p.pid}</td><td>{p.name}</td><td className="font-mono">{p.cpuPercent.toFixed(1)}</td><td className="font-mono">{p.memoryPercent.toFixed(1)}</td><td><Badge className="bg-transparent text-foreground border">{p.state}</Badge></td></tr>
          ))}
        </tbody>
      </table>
      {rows.length > 15 ? <button type="button" className="mt-2 text-xs underline" onClick={() => setExpanded((v) => !v)}>{expanded ? "Show top 15" : `Show all (${rows.length})`}</button> : null}
    </section>
  );
}
