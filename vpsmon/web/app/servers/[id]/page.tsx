import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ServerDashboard } from "@/components/layout/ServerDashboard";

interface ServerPageProps {
  params: Promise<{ id: string }>;
}

export default async function ServerPage({ params }: ServerPageProps) {
  const { id } = await params;

  return (
    <DashboardLayout serverId={id} serverName={id}>
      <ServerDashboard serverId={id} />
    </DashboardLayout>
  );
}
