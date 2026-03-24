"use client";

import { CpuPanel } from "@/components/panels/CpuPanel";
import { DiskPanel } from "@/components/panels/DiskPanel";
import { NetworkPanel } from "@/components/panels/NetworkPanel";
import { RamPanel } from "@/components/panels/RamPanel";
import { ServerHeader } from "@/components/panels/ServerHeader";
import { HealthScore } from "@/components/ui/HealthScore";
import { UptimePanel } from "@/components/panels/UptimePanel";
import { useSnapshot } from "@/hooks/useMetrics";

interface CompareViewProps {
  serverIds: string[];
}

function gridClass(columns: number): string {
  if (columns >= 4) return "xl:grid-cols-4";
  if (columns === 3) return "xl:grid-cols-3";
  if (columns === 2) return "xl:grid-cols-2";
  return "xl:grid-cols-1";
}

export function CompareView({ serverIds }: CompareViewProps) {
  const ids = serverIds.slice(0, 4);

  return (
    <div className={`grid grid-cols-1 gap-4 ${gridClass(ids.length)}`}>
      {ids.map((serverId) => <CompareColumn key={serverId} serverId={serverId} />)}
    </div>
  );
}

function CompareColumn({ serverId }: { serverId: string }) {
  const { data: snapshot } = useSnapshot(serverId);

  if (!snapshot) {
    return <section className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">Loading {serverId}…</section>;
  }

  const health = Math.max(0, Math.min(100, Math.round(100 - (snapshot.cpu.usagePercent * 0.4 + snapshot.ram.usagePercent * 0.35 + (snapshot.disks[0]?.usagePercent ?? 0) * 0.25))));

  return (
    <div className="space-y-3">
      <ServerHeader
        hostname={snapshot.hostname}
        uptime={`${Math.floor(snapshot.uptimeSeconds / 3600)}h`}
        loadAvg1={snapshot.cpu.loadAverage1m}
        loadAvg5={snapshot.cpu.loadAverage5m}
        loadAvg15={snapshot.cpu.loadAverage15m}
        isOnline
        lastUpdated={snapshot.timestamp}
        healthScore={health}
      />
      <div className="rounded-lg border bg-card p-3 text-right"><HealthScore score={health} size="md" /></div>
      <CpuPanel usagePercent={snapshot.cpu.usagePercent} temperatureCelsius={snapshot.cpu.temperatureCelsius} loadAvg1={snapshot.cpu.loadAverage1m} loadAvg5={snapshot.cpu.loadAverage5m} loadAvg15={snapshot.cpu.loadAverage15m} cores={snapshot.cpu.cores} history={[snapshot.cpu.usagePercent]} />
      <RamPanel usagePercent={snapshot.ram.usagePercent} totalBytes={snapshot.ram.totalBytes} usedBytes={snapshot.ram.usedBytes} freeBytes={snapshot.ram.freeBytes} cachedBytes={snapshot.ram.cachedBytes} bufferedBytes={snapshot.ram.bufferedBytes} swapUsedBytes={snapshot.ram.swapUsedBytes} swapTotalBytes={snapshot.ram.swapTotalBytes} history={[snapshot.ram.usagePercent]} />
      <DiskPanel mounts={snapshot.disks} />
      <NetworkPanel interfaces={snapshot.network} rxHistory={snapshot.network.map((n) => n.rxBytesPerSecond)} txHistory={snapshot.network.map((n) => n.txBytesPerSecond)} />
      <UptimePanel serverId={serverId} />
    </div>
  );
}
