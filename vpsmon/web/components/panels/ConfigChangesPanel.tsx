"use client";

import { useState } from "react";

import { useAlerts } from "@/hooks/useMetrics";

interface ConfigChangesPanelProps {
  serverId: string;
}

export function ConfigChangesPanel({ serverId }: ConfigChangesPanelProps) {
  const { data } = useAlerts(serverId);
  const [selected, setSelected] = useState<string | null>(null);
  const events = (data ?? []).filter((alert) => alert.metric === "config_change");
  const active = events.find((event) => event.id === selected) ?? null;

  return (
    <section className="rounded-lg border bg-card p-4">
      <h3 className="mb-2 text-sm font-medium">Config Changes</h3>
      <div className="space-y-2">
        {events.map((event) => (
          <button key={event.id} type="button" className="flex w-full items-center justify-between rounded border p-2 text-left text-xs" onClick={() => setSelected(event.id)}>
            <span>{event.message}</span>
            <span className="rounded bg-orange-500 px-2 py-0.5 text-[10px] font-semibold text-white">Changed</span>
          </button>
        ))}
      </div>
      {active ? (
        <div className="mt-3 rounded border bg-muted p-3 text-xs">
          <div className="mb-1 font-medium">Details</div>
          <p>{active.message}</p>
          <p className="mt-1 text-muted-foreground">Threshold: {active.threshold}</p>
          <button type="button" className="mt-2 rounded border px-2 py-1" onClick={() => setSelected(null)}>Close</button>
        </div>
      ) : null}
    </section>
  );
}
