import crypto from "node:crypto";
import path from "node:path";

import { SilenceSchema, type Silence } from "@/lib/schemas";
import { atomicWrite, readJsonFile } from "@/lib/storage";

const FILE_PATH = path.resolve(process.env.VPSMON_SILENCES_PATH ?? "./silences.json");

async function readAll(): Promise<Silence[]> {
  return SilenceSchema.array().parse(await readJsonFile<Silence[]>(FILE_PATH, []));
}

export async function getSilences(serverId?: string): Promise<Silence[]> {
  const items = await readAll();
  return serverId ? items.filter((item) => item.serverId === serverId) : items;
}

export async function createSilence(serverId: string, data: Omit<Silence, "id" | "serverId" | "createdAt">): Promise<Silence> {
  const items = await readAll();
  const next = SilenceSchema.parse({ ...data, id: crypto.randomUUID(), serverId, createdAt: Date.now() });
  await atomicWrite(FILE_PATH, [next, ...items]);
  return next;
}

export async function deleteSilence(id: string): Promise<void> {
  const items = await readAll();
  await atomicWrite(FILE_PATH, items.filter((item) => item.id !== id));
}

export async function isMetricSilenced(serverId: string, metric: string, now: number = Date.now()): Promise<{ silenced: boolean; reason?: string }> {
  const items = await getSilences(serverId);
  const match = items.find((item) => item.metric === metric && (item.expiresAt === null || item.expiresAt > now));
  return match ? { silenced: true, reason: match.reason } : { silenced: false };
}
