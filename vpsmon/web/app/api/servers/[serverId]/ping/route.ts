import { NextResponse } from "next/server";

import { getServer, agentRequest } from "@/lib/servers";

export async function GET(_req: Request, { params }: { params: Promise<{ serverId: string }> }) {
  const { serverId } = await params;
  const server = getServer(serverId);
  if (!server) return NextResponse.json({ error: "Server not found" }, { status: 404 });
  const start = Date.now();
  await agentRequest(server, { cmd: "ping" });
  const latencyMs = Date.now() - start;
  return NextResponse.json({ latencyMs, status: "online", checkedAt: Date.now() });
}
