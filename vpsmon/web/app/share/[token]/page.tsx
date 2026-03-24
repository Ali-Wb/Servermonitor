import { headers } from "next/headers";

import { CpuPanel } from "@/components/panels/CpuPanel";
import { DiskPanel } from "@/components/panels/DiskPanel";
import { NetworkPanel } from "@/components/panels/NetworkPanel";
import { RamPanel } from "@/components/panels/RamPanel";
import { ServicesPanel } from "@/components/panels/ServicesPanel";
import { UptimePanel } from "@/components/panels/UptimePanel";
import { HealthScore } from "@/components/ui/HealthScore";
import { verifyShareToken } from "@/lib/share";
import type { UptimeData } from "@/lib/schemas";

interface SharePageProps {
  params: Promise<{ token: string }>;
}

function readOnlyHealth(cpu: number, ram: number, disk: number): number {
  const stress = cpu * 0.4 + ram * 0.35 + disk * 0.25;
  return Math.max(0, Math.min(100, Math.round(100 - stress)));
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const share = await verifyShareToken(token);

  if (!share) {
    return (
      <main className="mx-auto max-w-3xl p-8 text-center">
        <h1 className="text-2xl font-semibold">Link expired or invalid</h1>
      </main>
    );
  }

  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  const snapshotResponse = await fetch(`${proto}://${host}/api/share/${encodeURIComponent(token)}/snapshot`, { cache: "no-store" });

  if (!snapshotResponse.ok) {
    return (
      <main className="mx-auto max-w-3xl p-8 text-center">
        <h1 className="text-2xl font-semibold">Link expired or invalid</h1>
      </main>
    );
  }

  const snapshot = await snapshotResponse.json() as {
    hostname: string;
    uptimeSeconds: number;
    cpu: { usagePercent: number; temperatureCelsius: number | null; loadAverage1m: number; loadAverage5m: number; loadAverage15m: number; cores: Array<{ id: number; label: string; usagePercent: number }> };
    ram: { usagePercent: number; totalBytes: number; usedBytes: number; freeBytes: number; cachedBytes: number; bufferedBytes: number; swapUsedBytes: number; swapTotalBytes: number };
    disks: Array<{ mountpoint: string; usagePercent: number; usedBytes: number; totalBytes: number; readBytesPerSecond: number; writeBytesPerSecond: number; ioLatencyMs: number | null; daysUntilFull?: number | null }>;
    network: Array<{ name: string; rxBytesPerSecond: number; txBytesPerSecond: number; rxPacketsPerSecond: number; txPacketsPerSecond: number; rxErrors: number; txErrors: number; monthlyRxBytes: number; monthlyTxBytes: number }>;
    services: Array<{ name: string; status: "active" | "failed" | "stopped" | "inactive" | "unknown"; since: number | null; message: string | null }>;
  };

  const health = readOnlyHealth(snapshot.cpu.usagePercent, snapshot.ram.usagePercent, snapshot.disks[0]?.usagePercent ?? 0);

  const uptimeData: UptimeData = {
    period: "share",
    uptimePercent: 100,
    expectedSeconds: Math.max(1, snapshot.uptimeSeconds),
    uptimeSeconds: snapshot.uptimeSeconds,
    gaps: [],
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <h1 className="text-sm font-semibold">vpsmon — {snapshot.hostname} — Read-only view</h1>
          <span className="rounded bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">Info</span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-4 p-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs text-muted-foreground">Health score</div>
          <HealthScore score={health} size="lg" />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <CpuPanel usagePercent={snapshot.cpu.usagePercent} temperatureCelsius={snapshot.cpu.temperatureCelsius} loadAvg1={snapshot.cpu.loadAverage1m} loadAvg5={snapshot.cpu.loadAverage5m} loadAvg15={snapshot.cpu.loadAverage15m} cores={snapshot.cpu.cores} history={[snapshot.cpu.usagePercent]} />
          <RamPanel usagePercent={snapshot.ram.usagePercent} totalBytes={snapshot.ram.totalBytes} usedBytes={snapshot.ram.usedBytes} freeBytes={snapshot.ram.freeBytes} cachedBytes={snapshot.ram.cachedBytes} bufferedBytes={snapshot.ram.bufferedBytes} swapUsedBytes={snapshot.ram.swapUsedBytes} swapTotalBytes={snapshot.ram.swapTotalBytes} history={[snapshot.ram.usagePercent]} />
          <DiskPanel mounts={snapshot.disks} />
          <NetworkPanel interfaces={snapshot.network} rxHistory={snapshot.network.map((item) => item.rxBytesPerSecond)} txHistory={snapshot.network.map((item) => item.txBytesPerSecond)} />
          <ServicesPanel services={snapshot.services} />
          <UptimePanel data={uptimeData} />
        </div>
      </main>

      <footer className="border-t px-4 py-3 text-center text-xs text-muted-foreground">
        {share.expiresAt ? `This link expires ${new Date(share.expiresAt).toLocaleString()}` : "This link does not expire"}
      </footer>
    </div>
  );
}
