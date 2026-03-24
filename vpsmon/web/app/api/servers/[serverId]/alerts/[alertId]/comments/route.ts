import { NextResponse } from "next/server";
import { z } from "zod";

import { createComment, getComments } from "@/lib/comments";

const BodySchema = z.object({ text: z.string().min(1) });

export async function GET(_req: Request, { params }: { params: Promise<{ serverId: string; alertId: string }> }) {
  const { serverId, alertId } = await params;
  return NextResponse.json(await getComments(serverId, alertId));
}

export async function POST(req: Request, { params }: { params: Promise<{ serverId: string; alertId: string }> }) {
  const { serverId, alertId } = await params;
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const role = req.headers.get("x-user-role") ?? "readonly";
  const created = await createComment(serverId, alertId, parsed.data.text, role);
  return NextResponse.json(created, { status: 201 });
}
