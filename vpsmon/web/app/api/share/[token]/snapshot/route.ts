import { NextResponse } from "next/server";

import { getServer, agentRequest } from "@/lib/servers";
import { verifyShareToken } from "@/lib/share";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const share = await verifyShareToken(token);
  if (!share) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (share.expiresAt !== null && share.expiresAt <= Date.now()) {
    return NextResponse.json({ error: "Expired" }, { status: 410 });
  }

  const server = getServer(share.serverId);
  if (!server) return NextResponse.json({ error: "Server not found" }, { status: 404 });
  const snapshot = await agentRequest(server, { cmd: "snapshot" }) as Record<string, unknown>;
  const limited = {
    timestamp: snapshot.timestamp,
    hostname: snapshot.hostname,
    uptimeSeconds: snapshot.uptimeSeconds,
    cpu: snapshot.cpu,
    ram: snapshot.ram,
    disks: snapshot.disks,
    network: snapshot.network,
    services: snapshot.services,
    health: snapshot.health,
    uptime: snapshot.uptime,
  };
  return NextResponse.json(limited);
}
