import { NextResponse } from "next/server";
import { z } from "zod";

import { createSilence, getSilences } from "@/lib/silences";

const BodySchema = z.object({ metric: z.string().min(1), reason: z.string().min(1), createdBy: z.string().optional(), expiresAt: z.number().nullable().optional() });

export async function GET(_req: Request, { params }: { params: Promise<{ serverId: string }> }) {
  const { serverId } = await params;
  return NextResponse.json(await getSilences(serverId));
}

export async function POST(req: Request, { params }: { params: Promise<{ serverId: string }> }) {
  const role = req.headers.get("x-user-role") ?? "readonly";
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { serverId } = await params;
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const created = await createSilence(serverId, {
    metric: parsed.data.metric,
    reason: parsed.data.reason,
    createdBy: parsed.data.createdBy ?? role,
    expiresAt: parsed.data.expiresAt ?? null,
  });
  return NextResponse.json(created, { status: 201 });
}
