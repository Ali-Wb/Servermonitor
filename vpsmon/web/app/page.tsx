import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ServerListView } from "@/components/layout/ServerListView";
import type { ServerSummary } from "@/lib/api";
import { getGroups } from "@/lib/groups";
import { getMaintenanceWindows } from "@/lib/maintenance";
import { getServers } from "@/lib/servers";

interface HomeProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const groupId = typeof params.groupId === "string" ? params.groupId : "";

  const [serverConfigs, groups, maintenance] = await Promise.all([
    Promise.resolve(getServers()),
    getGroups(),
    getMaintenanceWindows(),
  ]);

  const servers: ServerSummary[] = serverConfigs.map((server) => ({
    id: server.id,
    name: server.name,
    host: server.host,
    status: "unknown",
    groupId: groups.find((group) => group.serverIds.includes(server.id))?.id ?? null,
    lastSeenAt: null,
  }));

  return (
    <DashboardLayout>
      <ServerListView servers={servers} groups={groups} maintenance={maintenance} initialQuery={query} initialGroupId={groupId} />
    </DashboardLayout>
  );
}
