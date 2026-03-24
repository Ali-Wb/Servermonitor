import { NextRequest, NextResponse } from "next/server";

import { getAuditLog } from "@/lib/audit";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "100");
  return NextResponse.json(await getAuditLog(limit));
}
