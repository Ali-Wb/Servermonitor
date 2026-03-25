import { NextResponse } from "next/server";
import { z } from "zod";

import { createShareToken, getShareTokens } from "@/lib/share";

const BodySchema = z.object({ serverId: z.string(), label: z.string(), createdBy: z.string().optional(), expiresAt: z.number().nullable().optional() });

export async function GET(req: Request) {
  const role = req.headers.get("x-user-role") ?? "readonly";
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await getShareTokens());
}

export async function POST(req: Request) {
  const role = req.headers.get("x-user-role") ?? "readonly";
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const created = await createShareToken(parsed.data.serverId, {
    label: parsed.data.label,
    createdBy: parsed.data.createdBy ?? role,
    expiresAt: parsed.data.expiresAt ?? null,
  });
  return NextResponse.json(created, { status: 201 });
}
