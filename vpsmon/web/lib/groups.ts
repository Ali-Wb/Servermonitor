import crypto from "node:crypto";
import path from "node:path";

import { ServerGroupSchema, type ServerGroup } from "@/lib/schemas";
import { atomicWrite, readJsonFile } from "@/lib/storage";

const FILE_PATH = path.resolve(process.env.VPSMON_GROUPS_PATH ?? "./groups.json");

async function readAll(): Promise<ServerGroup[]> {
  return ServerGroupSchema.array().parse(await readJsonFile<ServerGroup[]>(FILE_PATH, []));
}

export async function getGroups(): Promise<ServerGroup[]> {
  return readAll();
}

export async function createGroup(data: Omit<ServerGroup, "id" | "createdAt">): Promise<ServerGroup> {
  const items = await readAll();
  const next = ServerGroupSchema.parse({ ...data, id: crypto.randomUUID(), createdAt: Date.now() });
  await atomicWrite(FILE_PATH, [next, ...items]);
  return next;
}

export async function updateGroup(id: string, data: Partial<Omit<ServerGroup, "id" | "createdAt">>): Promise<ServerGroup | null> {
  const items = await readAll();
  const current = items.find((item) => item.id === id);
  if (!current) return null;
  const next = ServerGroupSchema.parse({ ...current, ...data });
  await atomicWrite(FILE_PATH, items.map((item) => item.id === id ? next : item));
  return next;
}

export async function deleteGroup(id: string): Promise<void> {
  const items = await readAll();
  await atomicWrite(FILE_PATH, items.filter((item) => item.id !== id));
}
