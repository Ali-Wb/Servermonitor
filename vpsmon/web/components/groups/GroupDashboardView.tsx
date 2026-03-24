"use client";

import { ServerCard } from "@/components/layout/ServerCard";
import type { ServerSummary } from "@/lib/api";
import type { ServerGroup } from "@/lib/schemas";

interface GroupDashboardViewProps {
  group: ServerGroup;
  servers: ServerSummary[];
}

export function GroupDashboardView({ group, servers }: GroupDashboardViewProps) {
  const items = servers.filter((server) => group.serverIds.includes(server.id));

  return (
    <div className="space-y-4">
      <section className="rounded-lg border bg-card p-4">
        <h1 className="text-lg font-semibold">{group.name}</h1>
        <p className="text-sm text-muted-foreground">{group.description ?? "No description"}</p>
      </section>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((server) => <ServerCard key={server.id} server={server} group={group} />)}
      </div>
    </div>
  );
}
