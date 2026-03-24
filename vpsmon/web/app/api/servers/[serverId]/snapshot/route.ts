import { NextResponse } from "next/server";

import { getMockSnapshot, isMockMode } from "@/lib/mock";
import { getServer, agentRequest } from "@/lib/servers";

export async function GET(_req: Request, { params }: { params: Promise<{ serverId: string }> }) {
  const { serverId } = await params;
  if (isMockMode()) return NextResponse.json(getMockSnapshot(serverId));
  const server = getServer(serverId);
  if (!server) return NextResponse.json({ error: "Server not found" }, { status: 404 });
  const data = await agentRequest(server, { cmd: "snapshot" });
  return NextResponse.json(data);
}
