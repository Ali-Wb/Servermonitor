"use client";

// Bandwidth panel querying day/week/month buckets via useBandwidth hook.
// Presents simple tabbed controls and stat blocks for transfer totals.

import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBandwidth } from "@/hooks/useMetrics";
import { formatBytes } from "@/lib/format";

interface BandwidthPanelProps {
  serverId: string;
}

type Period = "day" | "week" | "month";

export function BandwidthPanel({ serverId }: BandwidthPanelProps) {
  const [period, setPeriod] = useState<Period>("day");
  const { data, isPending, isError } = useBandwidth(serverId, period);
  const latest = data?.[0];

  return (
    <section className="animate-[fadeInUp_0.55s_ease-out] rounded-lg border bg-card p-4">
      <div className="mb-3 text-sm font-medium">Bandwidth</div>

      <Tabs>
        <TabsList>
          {(["day", "week", "month"] as Period[]).map((p) => (
            <TabsTrigger key={p} onClick={() => setPeriod(p)} className={period === p ? "bg-background" : ""}>{p}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent>
          {isPending ? <div className="text-sm text-muted-foreground">Loading...</div> : null}
          {isError ? <div className="text-sm text-destructive">Failed to load bandwidth.</div> : null}
          {!isPending && !isError && latest ? (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <div className="rounded border p-2">
                <div className="text-xs text-muted-foreground">RX</div>
                <div className="font-mono text-lg">{formatBytes(latest.rxBytes)}</div>
              </div>
              <div className="rounded border p-2">
                <div className="text-xs text-muted-foreground">TX</div>
                <div className="font-mono text-lg">{formatBytes(latest.txBytes)}</div>
              </div>
              <div className="rounded border p-2">
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="font-mono text-lg">{formatBytes(latest.totalBytes)}</div>
              </div>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </section>
  );
}
