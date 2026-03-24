import { NextResponse } from "next/server";

import { getMockAgentHealth, isMockMode } from "@/lib/mock";
import { getServer, agentRequest } from "@/lib/servers";

export async function GET(_req: Request, { params }: { params: Promise<{ serverId: string }> }) {
  const { serverId } = await params;
  const health = isMockMode() ? getMockAgentHealth() : await agentRequest(getServer(serverId)!, { cmd: "health" }) as any;
  const expected = process.env.VPSMON_EXPECTED_AGENT_VERSION;
  const versionMismatch = expected && health.version !== expected;
  return NextResponse.json({ ...health, versionMismatch: Boolean(versionMismatch) });
}
