import { NextResponse } from "next/server";
import { z } from "zod";

import { createAnnotation, getAnnotations } from "@/lib/annotations";

const BodySchema = z.object({ title: z.string().min(1), description: z.string().nullable().optional(), timestamp: z.number() });

export async function GET(_req: Request, { params }: { params: Promise<{ serverId: string }> }) {
  const { serverId } = await params;
  return NextResponse.json(await getAnnotations(serverId));
}

export async function POST(req: Request, { params }: { params: Promise<{ serverId: string }> }) {
  const { serverId } = await params;
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const role = req.headers.get("x-user-role") ?? "readonly";
  const created = await createAnnotation({ serverId, title: parsed.data.title, description: parsed.data.description ?? null, createdBy: role, timestamp: parsed.data.timestamp });
  return NextResponse.json(created, { status: 201 });
}
