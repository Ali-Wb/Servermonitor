"use client";

import { Bell } from "lucide-react";
import { useMemo, useState } from "react";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAlerts } from "@/hooks/useMetrics";
import type { AlertEvent } from "@/lib/schemas";

interface NotificationCenterProps {
  serverId?: string;
}

function loadSeen(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem("vpsmon-notif-seen");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function saveSeen(items: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("vpsmon-notif-seen", JSON.stringify(items));
}

export function NotificationCenter({ serverId = "local" }: NotificationCenterProps) {
  const { data } = useAlerts(serverId);
  const [seen, setSeen] = useState<string[]>(() => loadSeen());

  const alerts = data ?? [];
  const unread = alerts.filter((alert) => !seen.includes(alert.id)).length;

  const grouped = useMemo(() => {
    const map = new Map<string, AlertEvent[]>();
    alerts.forEach((alert) => {
      const key = serverId;
      map.set(key, [...(map.get(key) ?? []), alert]);
    });
    return Array.from(map.entries());
  }, [alerts, serverId]);

  const markAllRead = () => {
    const ids = alerts.map((item) => item.id);
    setSeen(ids);
    saveSeen(ids);
  };

  const clearAll = () => {
    setSeen([]);
    saveSeen([]);
  };

  return (
    <Sheet>
      <SheetTrigger>
        <button type="button" className="relative rounded border p-1" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 ? <span className="absolute -right-1 -top-1 rounded-full bg-blue-600 px-1 text-[10px] text-white">{unread}</span> : null}
        </button>
      </SheetTrigger>
      <SheetContent className="ml-auto h-full w-full max-w-md overflow-auto">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Notification Center</h3>
          <div className="space-x-2 text-xs">
            <button type="button" className="rounded border px-2 py-1" onClick={markAllRead}>Mark all read</button>
            <button type="button" className="rounded border px-2 py-1" onClick={clearAll}>Clear all</button>
          </div>
        </div>

        <div className="space-y-3">
          {grouped.map(([server, items]) => (
            <section key={server} className="space-y-2">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground">{server}</h4>
              {items.map((alert) => (
                <article key={alert.id} className={`rounded border p-2 text-xs ${seen.includes(alert.id) ? "" : "border-blue-500"}`}>
                  <div className="mb-1 flex flex-wrap items-center gap-1">
                    <span className={`rounded px-1.5 py-0.5 ${alert.severity === "critical" ? "bg-red-600 text-white" : "bg-amber-500 text-black"}`}>{alert.severity}</span>
                    {alert.isAnomaly ? <span className="rounded bg-purple-600 px-1.5 py-0.5 text-white">σ {alert.anomalySigma?.toFixed(2) ?? "—"}</span> : null}
                    {alert.suppressed ? <span className="rounded bg-slate-500 px-1.5 py-0.5 text-white">{alert.suppressedReason === "maintenance" ? "Suppressed" : "Silenced"}</span> : null}
                  </div>
                  <p>{alert.metric}: {alert.message}</p>
                </article>
              ))}
            </section>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
