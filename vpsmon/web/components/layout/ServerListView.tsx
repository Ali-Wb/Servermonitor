"use client";

import { useMemo, useState } from "react";

import { GroupCard } from "@/components/layout/GroupCard";
import { ServerCard } from "@/components/layout/ServerCard";
import { ServerSearch } from "@/components/layout/ServerSearch";
import type { ServerSummary } from "@/lib/api";
import type { MaintenanceWindow, ServerGroup } from "@/lib/schemas";

interface ServerListViewProps {
  servers: ServerSummary[];
  groups: ServerGroup[];
  maintenance: MaintenanceWindow[];
  initialQuery?: string;
  initialGroupId?: string;
}

function isMaintenanceActive(item: MaintenanceWindow, now: number): boolean {
  if (!item.enabled) return false;
  if (!item.schedule.startsWith("once:")) return false;
  const start = Number(item.schedule.slice(5));
  if (!Number.isFinite(start)) return false;
  const end = start + item.durationMinutes * 60000;
  return now >= start && now <= end;
}

export function ServerListView({ servers, groups, maintenance, initialQuery = "", initialGroupId = "" }: ServerListViewProps) {
  const [query, setQuery] = useState(initialQuery);
  const [groupId, setGroupId] = useState(initialGroupId);

  const maintenanceSet = useMemo(() => {
    const now = Date.now();
    return new Set(maintenance.filter((item) => isMaintenanceActive(item, now)).map((item) => item.serverId));
  }, [maintenance]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return servers.map((server) => {
      const textMatch = q.length === 0 || server.name.toLowerCase().includes(q) || server.host.toLowerCase().includes(q);
      const groupMatch = groupId.length === 0 || server.groupId === groupId;
      return { server, match: textMatch && groupMatch };
    });
  }, [groupId, query, servers]);

  return (
    <div className="space-y-4">
      <ServerSearch
        value={query}
        onChange={setQuery}
        statusFilter="all"
        onStatusFilterChange={() => {}}
        cpuFilter="all"
        onCpuFilterChange={() => {}}
        groupId={groupId}
        onGroupChange={setGroupId}
        groups={groups.map((group) => ({ id: group.id, name: group.name }))}
      />

      {groups.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => <GroupCard key={group.id} group={group} servers={servers} />)}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map(({ server, match }) => (
          <div key={server.id} className={match ? "opacity-100" : "opacity-40"}>
            <ServerCard
              server={server}
              group={groups.find((group) => group.id === server.groupId)}
              isMaintenance={maintenanceSet.has(server.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
