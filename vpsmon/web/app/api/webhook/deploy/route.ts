import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { createAnnotation } from "@/lib/annotations";

function verifySignature(secret: string, body: string, header: string | null): boolean {
  if (!header) return false;
  const sha256 = `sha256=${crypto.createHmac("sha256", secret).update(body).digest("hex")}`;
  const plain = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(header), Buffer.from(sha256)) || crypto.timingSafeEqual(Buffer.from(header), Buffer.from(plain));
}

export async function POST(req: Request) {
  const secret = process.env.VPSMON_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured — set VPSMON_WEBHOOK_SECRET" }, { status: 503 });
  }

  const bodyText = await req.text();
  const sig = req.headers.get("x-hub-signature-256") || req.headers.get("x-gitlab-token") || req.headers.get("x-signature");
  const valid = verifySignature(secret, bodyText, sig);
  if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  const payload = JSON.parse(bodyText || "{}");
  const serverId = payload.serverId ?? "local";
  await createAnnotation({
    serverId,
    title: "Deploy webhook",
    description: payload.ref ? `Deployment on ${payload.ref}` : "Deployment received",
    createdBy: "webhook",
    timestamp: Date.now(),
  });

  return NextResponse.json({ ok: true });
}
