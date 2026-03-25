import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BandwidthPanel } from "@/components/panels/BandwidthPanel";
import { CpuPanel } from "@/components/panels/CpuPanel";
import { DiskPanel } from "@/components/panels/DiskPanel";
import { LatencySparkline } from "@/components/charts/LatencySparkline";
import { NetworkPanel } from "@/components/panels/NetworkPanel";
import { RamPanel } from "@/components/panels/RamPanel";
import { Sparkline } from "@/components/charts/Sparkline";
import { ServerHeader } from "@/components/panels/ServerHeader";
import { Card, CardContent } from "@/components/ui/card";
import { getMockSnapshot } from "@/lib/mock";

export default function Home() {
  const serverId = "local";
  const snapshot = getMockSnapshot(serverId);
  const spark = [12, 25, 18, 32, 20, 24, 29, 31, 22, 19];
  const latency = [8, 10, 6, 14, 12, 9, 7, 11, 6, 8];

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <ServerHeader
          hostname={snapshot.hostname}
          uptime={`${Math.floor(snapshot.uptimeSeconds / 86400)}d`}
          loadAvg1={snapshot.cpu.loadAverage1m}
          loadAvg5={snapshot.cpu.loadAverage5m}
          loadAvg15={snapshot.cpu.loadAverage15m}
          isOnline
          lastUpdated={Date.now() - 4000}
          healthScore={92}
          agentVersion="0.1.0"
          isMaintenance={false}
        />

        <Card>
          <CardContent className="flex flex-wrap items-center gap-6 p-4">
            <div>
              <div className="mb-1 text-xs text-muted-foreground">CPU trend</div>
              <Sparkline values={spark} />
            </div>
            <div>
              <div className="mb-1 text-xs text-muted-foreground">Latency</div>
              <LatencySparkline values={latency} />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <CpuPanel
            usagePercent={snapshot.cpu.usagePercent}
            temperatureCelsius={snapshot.cpu.temperatureCelsius}
            loadAvg1={snapshot.cpu.loadAverage1m}
            loadAvg5={snapshot.cpu.loadAverage5m}
            loadAvg15={snapshot.cpu.loadAverage15m}
            cores={snapshot.cpu.cores}
            history={[32, 41, 35, 52, 47, 44, 38, 33, 40, 42, 39, snapshot.cpu.usagePercent]}
          />
          <RamPanel
            usagePercent={snapshot.ram.usagePercent}
            totalBytes={snapshot.ram.totalBytes}
            usedBytes={snapshot.ram.usedBytes}
            freeBytes={snapshot.ram.freeBytes}
            cachedBytes={snapshot.ram.cachedBytes}
            bufferedBytes={snapshot.ram.bufferedBytes}
            swapUsedBytes={snapshot.ram.swapUsedBytes}
            swapTotalBytes={snapshot.ram.swapTotalBytes}
            history={[48, 52, 57, 61, 58, 59, 63, 60, snapshot.ram.usagePercent]}
          />
          <DiskPanel mounts={snapshot.disks} />
          <NetworkPanel
            interfaces={snapshot.network}
            rxHistory={[220, 260, 280, 300, 270, 250, 290, 310]}
            txHistory={[180, 170, 190, 210, 230, 200, 220, 205]}
          />
          <BandwidthPanel serverId={serverId} />
        </div>
      </div>
    </DashboardLayout>
  );
}
