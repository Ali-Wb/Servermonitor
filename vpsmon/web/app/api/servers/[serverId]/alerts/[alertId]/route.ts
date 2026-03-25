import { NextResponse } from "next/server";
import { z } from "zod";

import { getServer, agentRequest } from "@/lib/servers";

const BodySchema = z.object({ acknowledged: z.literal(true), acknowledgedBy: z.string().optional() });

export async function PATCH(req: Request, { params }: { params: Promise<{ serverId: string; alertId: string }> }) {
  const { serverId, alertId } = await params;
  const body = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: body.error.message }, { status: 400 });
  const data = await agentRequest(getServer(serverId)!, {
    cmd: "acknowledge-alert",
    alert_id: Number(alertId),
    acknowledged_by: body.data.acknowledgedBy ?? "api",
  });
  return NextResponse.json(data);
}
