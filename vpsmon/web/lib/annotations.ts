import crypto from "node:crypto";
import path from "node:path";
import { z } from "zod";

import { atomicWrite, readJsonFile } from "@/lib/storage";

export const AnnotationRecordSchema = z.object({
  id: z.string(),
  serverId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  createdBy: z.string(),
  createdAt: z.number(),
  timestamp: z.number(),
});

export type AnnotationRecord = z.infer<typeof AnnotationRecordSchema>;

const FILE_PATH = path.resolve(process.env.VPSMON_ANNOTATIONS_PATH ?? "./annotations.json");

async function readAll(): Promise<AnnotationRecord[]> {
  return AnnotationRecordSchema.array().parse(await readJsonFile<AnnotationRecord[]>(FILE_PATH, []));
}

export async function getAnnotations(serverId?: string): Promise<AnnotationRecord[]> {
  const items = await readAll();
  return serverId ? items.filter((item) => item.serverId === serverId) : items;
}

export async function createAnnotation(data: Omit<AnnotationRecord, "id" | "createdAt">): Promise<AnnotationRecord> {
  const items = await readAll();
  const next = AnnotationRecordSchema.parse({ ...data, id: crypto.randomUUID(), createdAt: Date.now() });
  await atomicWrite(FILE_PATH, [next, ...items]);
  return next;
}

export async function deleteAnnotation(id: string): Promise<void> {
  const items = await readAll();
  await atomicWrite(FILE_PATH, items.filter((item) => item.id !== id));
}
