"use client";

import Link from "next/link";

import { LatencySparkline } from "@/components/charts/LatencySparkline";
import { HealthScore } from "@/components/ui/HealthScore";
import { useLatencyHistory, useSnapshot } from "@/hooks/useMetrics";
import type { ServerSummary } from "@/lib/api";
import type { ServerGroup } from "@/lib/schemas";

interface ServerCardProps {
  server: ServerSummary;
  group?: ServerGroup;
  isMaintenance?: boolean;
}

function metricBar(value: number, color: string) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 rounded bg-muted">
      <div className={`h-2 rounded ${color}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}

function computeHealth(cpu: number, ram: number, disk: number): number {
  const stress = (cpu * 0.4) + (ram * 0.35) + (disk * 0.25);
  return Math.max(0, Math.min(100, Math.round(100 - stress)));
}

export function ServerCard({ server, group, isMaintenance = false }: ServerCardProps) {
  const { data: snapshot } = useSnapshot(server.id);
  const { history } = useLatencyHistory(server.id);

  const cpu = snapshot?.cpu.usagePercent ?? 0;
  const ram = snapshot?.ram.usagePercent ?? 0;
  const disk = snapshot?.disks[0]?.usagePercent ?? 0;
  const health = computeHealth(cpu, ram, disk);

  return (
    <Link href={`/servers/${encodeURIComponent(server.id)}`} className="block">
      <article
        className="rounded-lg border bg-card p-4 transition hover:border-primary/40"
        style={{ borderLeftColor: group?.color ?? "", borderLeftWidth: group ? 4 : 1 }}
      >
        <div className={`space-y-3 ${isMaintenance ? "rounded-md bg-purple-500/10 p-2" : ""}`}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">{server.name}</h3>
              <p className="text-xs text-muted-foreground">{server.host}</p>
            </div>
            <HealthScore score={health} size="sm" />
          </div>

          <LatencySparkline values={history.map((point) => point.latencyMs)} />

          <div className="space-y-2 text-xs">
            <div>
              <div className="mb-1 flex justify-between"><span>CPU</span><span className="font-mono">{cpu.toFixed(0)}%</span></div>
              {metricBar(cpu, "bg-blue-500")}
            </div>
            <div>
              <div className="mb-1 flex justify-between"><span>RAM</span><span className="font-mono">{ram.toFixed(0)}%</span></div>
              {metricBar(ram, "bg-amber-500")}
            </div>
            <div>
              <div className="mb-1 flex justify-between"><span>Disk</span><span className="font-mono">{disk.toFixed(0)}%</span></div>
              {metricBar(disk, "bg-emerald-500")}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
