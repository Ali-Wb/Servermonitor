"use client";

import { useMemo } from "react";

import type { ServerSummary } from "@/lib/api";
import type { ServerGroup } from "@/lib/schemas";

interface GroupCardProps {
  group: ServerGroup;
  servers: ServerSummary[];
}

export function GroupCard({ group, servers }: GroupCardProps) {
  const stats = useMemo(() => {
    const included = servers.filter((server) => group.serverIds.includes(server.id));
    const online = included.filter((server) => server.status === "online").length;
    const degraded = included.filter((server) => server.status === "degraded").length;
    const offline = included.filter((server) => server.status === "offline").length;
    const worst = offline > 0 ? "offline" : degraded > 0 ? "degraded" : "online";
    return { total: included.length, online, degraded, offline, worst };
  }, [group.serverIds, servers]);

  return (
    <article className="rounded-lg border bg-card p-3" style={{ borderLeftColor: group.color, borderLeftWidth: 4 }}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{group.name}</h3>
        <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${stats.worst === "offline" ? "bg-red-600 text-white" : stats.worst === "degraded" ? "bg-amber-500 text-black" : "bg-emerald-600 text-white"}`}>{stats.worst}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{stats.total} servers · {stats.online} online · {stats.degraded} degraded · {stats.offline} offline</p>
    </article>
  );
}
