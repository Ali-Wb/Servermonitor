import { NextResponse } from "next/server";

import { isInMaintenanceWindow } from "@/lib/maintenance";
import { getMockAlerts, isMockMode } from "@/lib/mock";
import { getServer, agentRequest } from "@/lib/servers";
import { isMetricSilenced } from "@/lib/silences";

export async function GET(_req: Request, { params }: { params: Promise<{ serverId: string }> }) {
  const { serverId } = await params;
  const data = isMockMode() ? getMockAlerts() : await agentRequest(getServer(serverId)!, { cmd: "alerts" }) as any[];
  const enriched = await Promise.all((data as any[]).map(async (alert) => {
    const inMaint = await isInMaintenanceWindow(serverId);
    const silence = await isMetricSilenced(serverId, alert.metric);
    if (inMaint) return { ...alert, suppressed: true, suppressedReason: "maintenance" };
    if (silence.silenced) return { ...alert, suppressed: true, suppressedReason: "silence" };
    return alert;
  }));
  return NextResponse.json(enriched);
}
