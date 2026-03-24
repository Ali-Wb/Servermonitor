import { notFound } from "next/navigation";

import { GroupDashboardView } from "@/components/groups/GroupDashboardView";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { ServerSummary } from "@/lib/api";
import { getGroups } from "@/lib/groups";
import { getServers } from "@/lib/servers";

interface GroupPageProps {
  params: Promise<{ groupId: string }>;
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { groupId } = await params;
  const [groups, serverConfigs] = await Promise.all([getGroups(), Promise.resolve(getServers())]);
  const group = groups.find((item) => item.id === groupId);
  if (!group) notFound();

  const servers: ServerSummary[] = serverConfigs.map((server) => ({
    id: server.id,
    name: server.name,
    host: server.host,
    status: "unknown",
    groupId: groups.find((item) => item.serverIds.includes(server.id))?.id ?? null,
    lastSeenAt: null,
  }));

  return (
    <DashboardLayout>
      <GroupDashboardView group={group} servers={servers} />
    </DashboardLayout>
  );
}
