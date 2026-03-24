import { NextResponse } from "next/server";
import { z } from "zod";

import { getThresholds, setThresholds } from "@/lib/thresholds";

const ThresholdSchema = z.record(z.string(), z.number());

export async function GET() {
  return NextResponse.json(await getThresholds());
}

export async function POST(req: Request) {
  const role = req.headers.get("x-user-role") ?? "readonly";
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = ThresholdSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  return NextResponse.json(await setThresholds(parsed.data));
}
