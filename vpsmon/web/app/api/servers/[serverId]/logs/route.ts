import { NextResponse } from "next/server";
import { z } from "zod";

import { getMockLogs, isMockMode } from "@/lib/mock";
import { getServer, agentRequest } from "@/lib/servers";

const QuerySchema = z.object({ lines: z.coerce.number().int().min(1).max(500).default(100) });

export async function GET(req: Request, { params }: { params: Promise<{ serverId: string }> }) {
  const role = req.headers.get("x-user-role");
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { serverId } = await params;
  const parsed = QuerySchema.safeParse({ lines: new URL(req.url).searchParams.get("lines") ?? "100" });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  if (isMockMode()) return NextResponse.json(getMockLogs());
  const data = await agentRequest(getServer(serverId)!, { cmd: "logs", lines: parsed.data.lines });
  return NextResponse.json(data);
}
