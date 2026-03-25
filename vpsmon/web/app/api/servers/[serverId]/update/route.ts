import { NextResponse } from "next/server";

import { agentRequest, getServer } from "@/lib/servers";

export async function POST(req: Request, { params }: { params: Promise<{ serverId: string }> }) {
  const role = req.headers.get("x-user-role") ?? "readonly";
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { serverId } = await params;
  const server = getServer(serverId);
  if (!server) return NextResponse.json({ error: "Server not found" }, { status: 404 });
  const data = await agentRequest(server, { cmd: "update" });
  return NextResponse.json(data);
}
