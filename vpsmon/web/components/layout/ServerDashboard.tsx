"use client";

import * as Sentry from "@sentry/nextjs";
import { DndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";

import { HistoryGraph } from "@/components/charts/HistoryGraph";
import { LogsPanel } from "@/components/logs/LogsPanel";
import { SnapshotDiffDialog } from "@/components/layout/SnapshotDiffDialog";
import { AlertTicker } from "@/components/alerts/AlertTicker";
import { BandwidthPanel } from "@/components/panels/BandwidthPanel";
import { ConfigChangesPanel } from "@/components/panels/ConfigChangesPanel";
import { CpuPanel } from "@/components/panels/CpuPanel";
import { CustomWidgetPanel } from "@/components/panels/CustomWidgetPanel";
import { DiskPanel } from "@/components/panels/DiskPanel";
import { NetworkPanel } from "@/components/panels/NetworkPanel";
import { RamPanel } from "@/components/panels/RamPanel";
import { ServerHeader } from "@/components/panels/ServerHeader";
import { UptimePanel } from "@/components/panels/UptimePanel";
import { useAgentHealth, useAlerts, useAnnotations, useHistory, useMaintenance, useSilences, useSnapshot, useWidgets } from "@/hooks/useMetrics";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useLayout } from "@/hooks/useLayout";

interface ServerDashboardProps {
  serverId: string;
}

export function ServerDashboard({ serverId }: ServerDashboardProps) {
  const snapshotQuery = useSnapshot(serverId);
  const alertsQuery = useAlerts(serverId);
  const healthQuery = useAgentHealth(serverId);
  const annotationsQuery = useAnnotations(serverId);
  const historyQuery = useHistory(serverId, "cpu_usage", 86400);
  const widgetsQuery = useWidgets(serverId);
  useMaintenance(serverId);
  useSilences(serverId);

  const { activeTab, setActiveTab } = useLayout(serverId);
  const [baseline, setBaseline] = useState<string | null>(null);
  const [baselineTs, setBaselineTs] = useState<number | null>(null);
  const [showDiff, setShowDiff] = useState(false);

  useKeyboardShortcuts({
    onRefresh: () => {
      void snapshotQuery.refetch();
      void alertsQuery.refetch();
    },
    onToggleTab: () => setActiveTab(activeTab === "live" ? "history" : "live"),
  });

  const expectedVersion = process.env.NEXT_PUBLIC_EXPECTED_AGENT_VERSION;
  const versionMismatch = Boolean(expectedVersion && healthQuery.data && healthQuery.data.version !== expectedVersion);

  if (versionMismatch) {
    Sentry.addBreadcrumb({
      category: "agent",
      level: "warning",
      message: `Version mismatch on ${serverId}`,
      data: { serverId, version: healthQuery.data?.version ?? "unknown" },
    });
  }

  if (snapshotQuery.isPending) {
    return <section className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">PageSkeleton</section>;
  }

  if (!snapshotQuery.data) {
    return <section className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">AgentOffline</section>;
  }

  const snapshot = snapshotQuery.data;
  const annotations = annotationsQuery.data ?? [];
  const alerts = alertsQuery.data ?? [];
  const widgets = widgetsQuery.data ?? [];

  const filteredAlerts = alerts.filter((alert) => !alert.suppressed);

  const takeBaseline = () => {
    window.localStorage.setItem("vpsmon-baseline-snapshot", JSON.stringify(snapshot));
    window.localStorage.setItem("vpsmon-baseline-ts", String(Date.now()));
    setBaseline(JSON.stringify(snapshot));
    setBaselineTs(Date.now());
  };

  const compareBaseline = () => {
    const base = window.localStorage.getItem("vpsmon-baseline-snapshot");
    const ts = window.localStorage.getItem("vpsmon-baseline-ts");
    if (base && ts) {
      setBaseline(base);
      setBaselineTs(Number(ts));
      setShowDiff(true);
    }
  };

  const configMarkers = useMemo(() => alerts.filter((alert) => alert.metric === "config_change"), [alerts]);

  return (
    <div className="space-y-4 pb-16">
      {snapshotQuery.isStale ? (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">Snapshot is stale.</div>
      ) : null}

      <ServerHeader
        hostname={snapshot.hostname}
        uptime={`${Math.floor(snapshot.uptimeSeconds / 3600)}h`}
        loadAvg1={snapshot.cpu.loadAverage1m}
        loadAvg5={snapshot.cpu.loadAverage5m}
        loadAvg15={snapshot.cpu.loadAverage15m}
        isOnline
        lastUpdated={snapshot.timestamp}
        agentVersion={healthQuery.data?.version}
        versionMismatch={versionMismatch}
        healthScore={Math.round(100 - (snapshot.cpu.usagePercent * 0.4 + snapshot.ram.usagePercent * 0.35 + (snapshot.disks[0]?.usagePercent ?? 0) * 0.25))}
      />

      <div className="flex flex-wrap gap-2">
        {(["live", "history", "bandwidth", "logs"] as const).map((tab) => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`rounded border px-3 py-1 text-xs ${activeTab === tab ? "bg-muted" : ""}`}>{tab}</button>
        ))}
        <button type="button" onClick={takeBaseline} className="rounded border px-3 py-1 text-xs">Take Baseline</button>
        <button type="button" onClick={compareBaseline} className="rounded border px-3 py-1 text-xs">Compare to Baseline</button>
      </div>

      {activeTab === "live" ? (
        <DndContext>
          <SortableContext items={["cpu", "ram", "disk", "network", "uptime", "logs", "config"]} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <CpuPanel usagePercent={snapshot.cpu.usagePercent} temperatureCelsius={snapshot.cpu.temperatureCelsius} loadAvg1={snapshot.cpu.loadAverage1m} loadAvg5={snapshot.cpu.loadAverage5m} loadAvg15={snapshot.cpu.loadAverage15m} cores={snapshot.cpu.cores} history={[snapshot.cpu.usagePercent]} />
              <RamPanel usagePercent={snapshot.ram.usagePercent} totalBytes={snapshot.ram.totalBytes} usedBytes={snapshot.ram.usedBytes} freeBytes={snapshot.ram.freeBytes} cachedBytes={snapshot.ram.cachedBytes} bufferedBytes={snapshot.ram.bufferedBytes} swapUsedBytes={snapshot.ram.swapUsedBytes} swapTotalBytes={snapshot.ram.swapTotalBytes} history={[snapshot.ram.usagePercent]} />
              <DiskPanel mounts={snapshot.disks} />
              <NetworkPanel interfaces={snapshot.network} rxHistory={snapshot.network.map((n) => n.rxBytesPerSecond)} txHistory={snapshot.network.map((n) => n.txBytesPerSecond)} />
              <UptimePanel serverId={serverId} />
              <LogsPanel serverId={serverId} />
              <ConfigChangesPanel serverId={serverId} />
              {widgets.map((widget) => <CustomWidgetPanel key={widget.id} widget={widget} snapshot={snapshot} />)}
            </div>
          </SortableContext>
        </DndContext>
      ) : null}

      {activeTab === "history" ? (
        <div className="space-y-3">
          <HistoryGraph data={historyQuery.data ?? []} metric="cpu_usage" annotations={annotations} timeRange="24h" serverId={serverId} />
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded border px-3 py-1 text-xs">Add annotation</button>
            {configMarkers.slice(0, 6).map((marker) => (
              <span key={marker.id} className="rounded bg-orange-500 px-2 py-0.5 text-[10px] font-semibold text-white">{new Date(marker.timestamp).toLocaleTimeString()} changed</span>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === "bandwidth" ? <BandwidthPanel serverId={serverId} /> : null}
      {activeTab === "logs" ? <LogsPanel serverId={serverId} /> : null}

      {showDiff && baseline && baselineTs ? <SnapshotDiffDialog baseline={JSON.parse(baseline)} current={snapshot} baselineTs={baselineTs} onClose={() => setShowDiff(false)} /> : null}

      <AlertTicker alerts={filteredAlerts} />
    </div>
  );
}
