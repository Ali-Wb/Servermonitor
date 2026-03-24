import { NextResponse } from "next/server";

import { revokeKey } from "@/lib/auth";

interface RouteContext {
  params: Promise<{ keyId: string }>;
}

export async function DELETE(_request: Request, context: RouteContext): Promise<NextResponse> {
  const { keyId } = await context.params;
  await revokeKey(keyId);
  return NextResponse.json({ ok: true });
}
