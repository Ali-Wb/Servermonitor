import { NextResponse } from "next/server";
import { z } from "zod";

import { createMaintenanceWindow, getMaintenanceWindows, parseCronExpression } from "@/lib/maintenance";

const BodySchema = z.object({ serverId: z.string(), label: z.string(), schedule: z.string(), durationMinutes: z.number().int().positive(), enabled: z.boolean(), createdBy: z.string().optional() });

export async function GET(req: Request) {
  const serverId = new URL(req.url).searchParams.get("serverId") ?? undefined;
  return NextResponse.json(await getMaintenanceWindows(serverId));
}

export async function POST(req: Request) {
  const role = req.headers.get("x-user-role") ?? "readonly";
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  if (parsed.data.schedule.startsWith("cron:")) {
    const cron = parseCronExpression(parsed.data.schedule);
    if (!cron.valid) return NextResponse.json({ error: cron.error ?? "Invalid cron" }, { status: 400 });
  }
  const created = await createMaintenanceWindow({ ...parsed.data, createdBy: parsed.data.createdBy ?? role });
  return NextResponse.json(created, { status: 201 });
}
