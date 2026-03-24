import crypto from "node:crypto";
import path from "node:path";
import { z } from "zod";

import { AlertCommentSchema, type AlertComment } from "@/lib/schemas";
import { atomicWrite, readJsonFile } from "@/lib/storage";

const FILE_PATH = path.resolve(process.env.VPSMON_COMMENTS_PATH ?? "./alert_comments.json");
const CommentRecordSchema = AlertCommentSchema.extend({ alertId: z.string(), serverId: z.string() });
export type CommentRecord = z.infer<typeof CommentRecordSchema>;

async function readAll(): Promise<CommentRecord[]> {
  return CommentRecordSchema.array().parse(await readJsonFile<CommentRecord[]>(FILE_PATH, []));
}

export async function getComments(serverId: string, alertId: string): Promise<AlertComment[]> {
  const items = await readAll();
  return items.filter((item) => item.serverId === serverId && item.alertId === alertId).map(({ alertId: _alertId, serverId: _serverId, ...comment }) => comment);
}

export async function createComment(serverId: string, alertId: string, text: string, author: string): Promise<AlertComment> {
  const items = await readAll();
  const next = CommentRecordSchema.parse({ id: crypto.randomUUID(), serverId, alertId, text, author, createdAt: Date.now() });
  await atomicWrite(FILE_PATH, [next, ...items]);
  const { alertId: _alertId, serverId: _serverId, ...comment } = next;
  return comment;
}

export async function deleteComment(id: string): Promise<void> {
  const items = await readAll();
  await atomicWrite(FILE_PATH, items.filter((item) => item.id !== id));
}
