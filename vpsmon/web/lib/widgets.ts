import crypto from "node:crypto";
import path from "node:path";

import { CustomWidgetSchema, type CustomWidget } from "@/lib/schemas";
import { atomicWrite, readJsonFile } from "@/lib/storage";

const FILE_PATH = path.resolve(process.env.VPSMON_WIDGETS_PATH ?? "./widgets.json");

async function readAll(): Promise<CustomWidget[]> {
  return CustomWidgetSchema.array().parse(await readJsonFile<CustomWidget[]>(FILE_PATH, []));
}

export async function getWidgets(serverId?: string): Promise<CustomWidget[]> {
  const items = await readAll();
  return serverId ? items.filter((item) => item.serverId === serverId) : items;
}

export async function createWidget(data: Omit<CustomWidget, "id">): Promise<CustomWidget> {
  const items = await readAll();
  const next = CustomWidgetSchema.parse({ ...data, id: crypto.randomUUID() });
  await atomicWrite(FILE_PATH, [next, ...items]);
  return next;
}

export async function deleteWidget(id: string): Promise<void> {
  const items = await readAll();
  await atomicWrite(FILE_PATH, items.filter((item) => item.id !== id));
}
