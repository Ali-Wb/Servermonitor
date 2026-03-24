"use client";

// Network panel with primary RX/TX sparklines and interface totals.
// Lists additional interfaces below the primary one for quick triage.

import { Activity } from "lucide-react";

import { Sparkline } from "@/components/charts/Sparkline";
import { formatBytes, formatRate } from "@/lib/format";

interface NetworkInterfaceView {
  name: string;
  rxBytesPerSecond: number;
  txBytesPerSecond: number;
  monthlyRxBytes: number;
  monthlyTxBytes: number;
}

interface NetworkPanelProps {
  interfaces: NetworkInterfaceView[];
  rxHistory: number[];
  txHistory: number[];
}

export function NetworkPanel({ interfaces, rxHistory, txHistory }: NetworkPanelProps) {
  const primary = interfaces[0];
  const rest = interfaces.slice(1);

  if (!primary) {
    return <section className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">No network interfaces.</section>;
  }

  return (
    <section className="animate-[fadeInUp_0.5s_ease-out] rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Activity className="h-4 w-4" />
        <span className="text-sm font-medium">Network ({primary.name})</span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <div className="mb-1 text-xs text-muted-foreground">RX</div>
          <Sparkline values={rxHistory} color="#22d3ee" />
          <div className="mt-1 font-mono text-sm">{formatRate(primary.rxBytesPerSecond)}</div>
        </div>
        <div>
          <div className="mb-1 text-xs text-muted-foreground">TX</div>
          <Sparkline values={txHistory} color="#60a5fa" />
          <div className="mt-1 font-mono text-sm">{formatRate(primary.txBytesPerSecond)}</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div>Monthly RX <span className="font-mono text-foreground">{formatBytes(primary.monthlyRxBytes)}</span></div>
        <div>Monthly TX <span className="font-mono text-foreground">{formatBytes(primary.monthlyTxBytes)}</span></div>
      </div>

      {rest.length > 0 ? (
        <div className="mt-3 space-y-1 text-xs">
          {rest.map((iface) => (
            <div key={iface.name} className="flex items-center justify-between rounded border px-2 py-1">
              <span className="font-mono">{iface.name}</span>
              <span className="font-mono text-muted-foreground">RX {formatRate(iface.rxBytesPerSecond)} · TX {formatRate(iface.txBytesPerSecond)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
