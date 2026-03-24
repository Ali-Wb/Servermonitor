"use client";

import type { DnsProbeResult } from "@/lib/schemas";

interface DnsPanelProps { results: DnsProbeResult[] }

function latencyClass(v: number | null): string {
  if (v == null) return "text-muted-foreground";
  if (v > 300) return "text-red-500";
  if (v > 150) return "text-amber-500";
  return "text-emerald-500";
}

export function DnsPanel({ results }: DnsPanelProps) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <h3 className="mb-2 text-sm font-medium">DNS</h3>
      <table className="w-full text-left text-xs">
        <thead className="text-muted-foreground"><tr><th>Host</th><th>Latency</th><th>Status</th><th>Last checked</th></tr></thead>
        <tbody>
          {results.map((r) => (
            <tr key={`${r.host}-${r.recordType}`} className="border-t">
              <td className="py-1 font-mono">{r.host}</td>
              <td className={latencyClass(r.latencyMs)}>{r.latencyMs == null ? "—" : `${r.latencyMs.toFixed(1)}ms`}</td>
              <td>{r.success ? "OK" : "Fail"}</td>
              <td className="font-mono">{new Date(r.checkedAt).toLocaleTimeString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
