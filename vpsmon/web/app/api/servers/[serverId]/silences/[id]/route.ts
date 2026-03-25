import { NextResponse } from "next/server";

import { deleteSilence } from "@/lib/silences";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const role = req.headers.get("x-user-role") ?? "readonly";
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await deleteSilence(id);
  return NextResponse.json({ ok: true });
}
