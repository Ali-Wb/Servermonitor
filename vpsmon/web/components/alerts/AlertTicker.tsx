"use client";

import type { AlertEvent } from "@/lib/schemas";

interface AlertTickerProps {
  alerts: AlertEvent[];
}

export function AlertTicker({ alerts }: AlertTickerProps) {
  const active = alerts.filter((alert) => !alert.resolvedAt && !alert.suppressed && !alert.acknowledged);
  if (active.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 px-3 py-2 backdrop-blur">
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto whitespace-nowrap text-xs">
        {active.map((alert) => (
          <span key={alert.id} className={`rounded px-2 py-0.5 ${alert.severity === "critical" ? "bg-red-600 text-white" : "bg-amber-500 text-black"}`}>
            {alert.metric}: {alert.message}
          </span>
        ))}
      </div>
    </div>
  );
}
