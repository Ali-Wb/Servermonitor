import { NextResponse } from "next/server";

import { deleteAnnotation } from "@/lib/annotations";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const role = req.headers.get("x-user-role") ?? "readonly";
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await deleteAnnotation(id);
  return NextResponse.json({ ok: true });
}
