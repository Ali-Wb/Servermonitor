import { NextResponse } from "next/server";

import { getServer, agentRequest } from "@/lib/servers";

export async function POST(req: Request, { params }: { params: Promise<{ serverId: string }> }) {
  const role = req.headers.get("x-user-role");
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { serverId } = await params;
  const data = await agentRequest(getServer(serverId)!, { cmd: "test-alert" });
  return NextResponse.json(data);
}
