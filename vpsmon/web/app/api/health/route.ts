import { cacheLife } from "next/cache";
import { NextResponse } from "next/server";

export async function GET() {
  "use cache";
  cacheLife("seconds");
  return NextResponse.json({ ok: true, timestamp: Date.now() });
}
