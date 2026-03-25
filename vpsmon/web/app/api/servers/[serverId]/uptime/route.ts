import { NextResponse } from "next/server";
import { z } from "zod";

import { getMockUptimeData, isMockMode } from "@/lib/mock";
import { getServer, agentRequest } from "@/lib/servers";

const QuerySchema = z.object({ period: z.string().default("day") });

export async function GET(req: Request, { params }: { params: Promise<{ serverId: string }> }) {
  const { serverId } = await params;
  const q = QuerySchema.safeParse({ period: new URL(req.url).searchParams.get("period") ?? "day" });
  if (!q.success) return NextResponse.json({ error: q.error.message }, { status: 400 });
  if (isMockMode()) return NextResponse.json(getMockUptimeData(q.data.period as any));
  const data = await agentRequest(getServer(serverId)!, { cmd: "uptime", period: q.data.period });
  return NextResponse.json(data);
}
