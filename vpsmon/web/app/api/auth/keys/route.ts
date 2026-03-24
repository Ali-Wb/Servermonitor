import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createKey, listKeys } from "@/lib/auth";

const CreateKeySchema = z.object({ label: z.string(), role: z.enum(["admin", "readonly"]), expiresAt: z.number().nullable().optional() });

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(await listKeys());
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null);
  const parsed = CreateKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  return NextResponse.json(await createKey(parsed.data.label, parsed.data.role, parsed.data.expiresAt ?? undefined));
}
