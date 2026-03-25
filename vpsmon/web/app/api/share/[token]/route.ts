import { NextResponse } from "next/server";

import { deleteShareToken } from "@/lib/share";

export async function DELETE(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const role = req.headers.get("x-user-role") ?? "readonly";
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { token } = await params;
  await deleteShareToken(token);
  return NextResponse.json({ ok: true });
}
