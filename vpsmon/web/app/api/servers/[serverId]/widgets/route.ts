import { NextResponse } from "next/server";
import { z } from "zod";

import { createWidget, getWidgets } from "@/lib/widgets";

const BodySchema = z.object({ title: z.string(), expression: z.string(), unit: z.string(), thresholdWarn: z.number(), thresholdCrit: z.number(), color: z.string() });

export async function GET(_req: Request, { params }: { params: Promise<{ serverId: string }> }) {
  const { serverId } = await params;
  return NextResponse.json(await getWidgets(serverId));
}

export async function POST(req: Request, { params }: { params: Promise<{ serverId: string }> }) {
  const role = req.headers.get("x-user-role") ?? "readonly";
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { serverId } = await params;
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const created = await createWidget({ serverId, ...parsed.data });
  return NextResponse.json(created, { status: 201 });
}
