import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GroupManagementView } from "@/components/groups/GroupManagementView";
import type { ServerSummary } from "@/lib/api";
import { getGroups } from "@/lib/groups";
import { getServers } from "@/lib/servers";

export default async function GroupsPage() {
  const [groups, serverConfigs] = await Promise.all([getGroups(), Promise.resolve(getServers())]);
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
      <GroupManagementView initialGroups={groups} servers={servers} />
    </DashboardLayout>
  );
}
