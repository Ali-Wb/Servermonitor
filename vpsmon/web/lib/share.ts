import crypto from "node:crypto";
import path from "node:path";

import { ShareTokenSchema, type ShareToken } from "@/lib/schemas";
import { atomicWrite, readJsonFile } from "@/lib/storage";

const FILE_PATH = path.resolve(process.env.VPSMON_SHARES_PATH ?? "./shares.json");

async function readAll(): Promise<ShareToken[]> {
  return ShareTokenSchema.array().parse(await readJsonFile<ShareToken[]>(FILE_PATH, []));
}

export async function getShareTokens(serverId?: string): Promise<ShareToken[]> {
  const items = await readAll();
  return serverId ? items.filter((item) => item.serverId === serverId) : items;
}

export async function createShareToken(serverId: string, data: Omit<ShareToken, "id" | "serverId" | "createdAt" | "token">): Promise<ShareToken> {
  const items = await readAll();
  const next = ShareTokenSchema.parse({ ...data, id: crypto.randomUUID(), serverId, token: crypto.randomBytes(32).toString("base64url"), createdAt: Date.now() });
  await atomicWrite(FILE_PATH, [next, ...items]);
  return next;
}

export async function deleteShareToken(id: string): Promise<void> {
  const items = await readAll();
  await atomicWrite(FILE_PATH, items.filter((item) => item.id !== id));
}

export async function verifyShareToken(token: string): Promise<ShareToken | null> {
  const items = await readAll();
  const now = Date.now();
  return items.find((item) => item.token === token && (item.expiresAt === null || item.expiresAt > now)) ?? null;
}
