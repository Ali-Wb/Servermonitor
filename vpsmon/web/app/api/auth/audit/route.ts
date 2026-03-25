import { NextRequest, NextResponse } from "next/server";

import { getAuditLog } from "@/lib/audit";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const role = request.headers.get("x-user-role") ?? "readonly";
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "100");
  return NextResponse.json(await getAuditLog(limit));
}
