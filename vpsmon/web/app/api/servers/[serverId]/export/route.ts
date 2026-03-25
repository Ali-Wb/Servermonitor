import { NextResponse } from "next/server";
import { z } from "zod";

import { getMockHistory, isMockMode } from "@/lib/mock";
import { generateSummaryReport } from "@/lib/report";
import { getServer, agentRequest } from "@/lib/servers";

const QuerySchema = z.object({
  format: z.enum(["csv", "json", "pdf"]).default("json"),
  range: z.enum(["7d", "30d", "custom"]).default("7d"),
  sections: z.string().optional(),
  companyName: z.string().optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ serverId: string }> }) {
  const { serverId } = await params;
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    format: url.searchParams.get("format") ?? "json",
    range: url.searchParams.get("range") ?? "7d",
    sections: url.searchParams.get("sections") ?? undefined,
    companyName: url.searchParams.get("companyName") ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const sections = (parsed.data.sections ?? "cpu,ram,disk,alerts").split(",").map((s) => s.trim()).filter(Boolean);
  const history = isMockMode()
    ? getMockHistory("cpu.usage_percent", 3600, 300)
    : await agentRequest(getServer(serverId)!, { cmd: "history", metric: "cpu.usage_percent", duration: parsed.data.range, maxPoints: 300 });

  if (parsed.data.format === "json") {
    return NextResponse.json({ sections, history });
  }

  if (parsed.data.format === "csv") {
    const rows = ["timestamp,value", ...(history as Array<{ timestamp: number; value: number }>).map((p) => `${p.timestamp},${p.value}`)];
    return new NextResponse(rows.join("\n"), { headers: { "content-type": "text/csv" } });
  }

  const pdf = await generateSummaryReport({ history, sections }, { sections, companyName: parsed.data.companyName });
  return new Response(pdf as unknown as BodyInit, { headers: { "content-type": "application/pdf" } });
}
