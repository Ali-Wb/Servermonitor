import { NextResponse } from "next/server";
import { z } from "zod";

import { getMockHistory, isMockMode } from "@/lib/mock";
import { getServer, agentRequest } from "@/lib/servers";

const QuerySchema = z.object({ metric: z.string().min(1), duration: z.string().min(1) });

export async function GET(req: Request, { params }: { params: Promise<{ serverId: string }> }) {
  const { serverId } = await params;
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({ metric: url.searchParams.get("metric"), duration: url.searchParams.get("duration") });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  if (isMockMode()) return NextResponse.json(getMockHistory(parsed.data.metric, 3600, 300));
  const server = getServer(serverId);
  if (!server) return NextResponse.json({ error: "Server not found" }, { status: 404 });
  const data = await agentRequest(server, { cmd: "history", metric: parsed.data.metric, duration: parsed.data.duration, maxPoints: 300 });
  return NextResponse.json(data);
}
