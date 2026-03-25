import { NextResponse } from "next/server";
import { z } from "zod";

import { createGroup, getGroups } from "@/lib/groups";

const BodySchema = z.object({ name: z.string().min(1), color: z.string().min(1), serverIds: z.array(z.string()), description: z.string().optional() });

export async function GET() {
  return NextResponse.json(await getGroups());
}

export async function POST(req: Request) {
  const role = req.headers.get("x-user-role") ?? "readonly";
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const created = await createGroup(parsed.data);
  return NextResponse.json(created, { status: 201 });
}
