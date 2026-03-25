import { NextResponse } from "next/server";
import { z } from "zod";

import { deleteMaintenanceWindow, parseCronExpression, updateMaintenanceWindow } from "@/lib/maintenance";

const BodySchema = z.object({ serverId: z.string().optional(), label: z.string().optional(), schedule: z.string().optional(), durationMinutes: z.number().int().positive().optional(), enabled: z.boolean().optional(), createdBy: z.string().optional() });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const role = req.headers.get("x-user-role") ?? "readonly";
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  if (parsed.data.schedule?.startsWith("cron:")) {
    const cron = parseCronExpression(parsed.data.schedule);
    if (!cron.valid) return NextResponse.json({ error: cron.error ?? "Invalid cron" }, { status: 400 });
  }
  const updated = await updateMaintenanceWindow(id, parsed.data);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const role = req.headers.get("x-user-role") ?? "readonly";
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await deleteMaintenanceWindow(id);
  return NextResponse.json({ ok: true });
}
