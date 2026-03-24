import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LatencySparkline } from "@/components/charts/LatencySparkline";
import { Sparkline } from "@/components/charts/Sparkline";
import { ServerHeader } from "@/components/panels/ServerHeader";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const spark = [12, 25, 18, 32, 20, 24, 29, 31, 22, 19];
  const latency = [8, 10, 6, 14, 12, 9, 7, 11, 6, 8];

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <ServerHeader
          hostname="prod-a.example.internal"
          uptime="17d 04h"
          loadAvg1={0.65}
          loadAvg5={0.72}
          loadAvg15={0.70}
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
      </div>
    </DashboardLayout>
  );
}
