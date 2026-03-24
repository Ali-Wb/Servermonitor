import { NextResponse } from "next/server";
import { z } from "zod";

import { deleteGroup, updateGroup } from "@/lib/groups";

const BodySchema = z.object({ name: z.string().min(1).optional(), color: z.string().min(1).optional(), serverIds: z.array(z.string()).optional(), description: z.string().optional() });

export async function PATCH(req: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const role = req.headers.get("x-user-role") ?? "readonly";
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { groupId } = await params;
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const updated = await updateGroup(groupId, parsed.data);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const role = req.headers.get("x-user-role") ?? "readonly";
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { groupId } = await params;
  await deleteGroup(groupId);
  return NextResponse.json({ ok: true });
}
