import { NextRequest, NextResponse } from "next/server";

import { verifyApiKey } from "@/lib/auth";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null);
  const key = typeof body?.key === "string" ? body.key : "";
  const role = await verifyApiKey(key, request.headers.get("x-forwarded-for") ?? "0.0.0.0", request.headers.get("user-agent") ?? "unknown");
  if (!role) {
    return NextResponse.json({ ok: false, error: "Invalid API key" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, role });
}
