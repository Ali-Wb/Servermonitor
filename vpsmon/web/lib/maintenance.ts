import crypto from "node:crypto";
import path from "node:path";

import { MaintenanceWindowSchema, type MaintenanceWindow } from "@/lib/schemas";
import { atomicWrite, readJsonFile } from "@/lib/storage";

const FILE_PATH = path.resolve(process.env.VPSMON_MAINTENANCE_PATH ?? "./maintenance.json");
const UNSUPPORTED_TOKENS = ["L", "#", "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

async function readAll(): Promise<MaintenanceWindow[]> {
  return MaintenanceWindowSchema.array().parse(await readJsonFile<MaintenanceWindow[]>(FILE_PATH, []));
}

function containsUnsupported(value: string): boolean {
  const upper = value.toUpperCase();
  return UNSUPPORTED_TOKENS.some((token) => upper.includes(token));
}

function matchesPart(part: string, current: number, min: number, max: number): boolean {
  if (part === "*") return true;
  if (part.includes(",")) return part.split(",").some((segment) => matchesPart(segment, current, min, max));
  if (part.includes("/")) {
    const [base, stepRaw] = part.split("/");
    const step = Number(stepRaw);
    if (!Number.isInteger(step) || step <= 0) return false;
    if (base === "*") return (current - min) % step === 0;
    return matchesPart(base, current, min, max) && (current - min) % step === 0;
  }
  if (part.includes("-")) {
    const [startRaw, endRaw] = part.split("-");
    const start = Number(startRaw);
    const end = Number(endRaw);
    return Number.isInteger(start) && Number.isInteger(end) && current >= start && current <= end;
  }
  const exact = Number(part);
  return Number.isInteger(exact) && exact >= min && exact <= max && current === exact;
}

function matchesCron(expression: string, now: Date): boolean {
  if (containsUnsupported(expression)) {
    console.warn(`[maintenance] unsupported cron syntax: ${expression}`);
    return false;
  }

  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return false;

  const values = [now.getUTCMinutes(), now.getUTCHours(), now.getUTCDate(), now.getUTCMonth() + 1, now.getUTCDay()];
  const ranges: Array<[number, number]> = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 6]];

  return parts.every((part, index) => matchesPart(part, values[index], ranges[index][0], ranges[index][1]));
}

export function parseCronExpression(expr: string): { valid: boolean; error?: string } {
  if (!expr.startsWith("cron:")) {
    return { valid: false, error: "Cron schedules must start with cron:" };
  }

  const body = expr.slice(5).trim();
  if (containsUnsupported(body)) {
    return { valid: false, error: "Unsupported cron syntax used" };
  }

  const parts = body.split(/\s+/);
  if (parts.length !== 5) {
    return { valid: false, error: "Expected 5 cron fields" };
  }

  return { valid: true };
}

export async function getMaintenanceWindows(serverId?: string): Promise<MaintenanceWindow[]> {
  const items = await readAll();
  return serverId ? items.filter((item) => item.serverId === serverId) : items;
}

export async function createMaintenanceWindow(data: Omit<MaintenanceWindow, "id" | "createdAt">): Promise<MaintenanceWindow> {
  const items = await readAll();
  const next = MaintenanceWindowSchema.parse({ ...data, id: crypto.randomUUID(), createdAt: Date.now() });
  await atomicWrite(FILE_PATH, [next, ...items]);
  return next;
}

export async function updateMaintenanceWindow(id: string, data: Partial<Omit<MaintenanceWindow, "id" | "createdAt">>): Promise<MaintenanceWindow | null> {
  const items = await readAll();
  const current = items.find((item) => item.id === id);
  if (!current) return null;
  const next = MaintenanceWindowSchema.parse({ ...current, ...data });
  await atomicWrite(FILE_PATH, items.map((item) => item.id === id ? next : item));
  return next;
}

export async function deleteMaintenanceWindow(id: string): Promise<void> {
  const items = await readAll();
  await atomicWrite(FILE_PATH, items.filter((item) => item.id !== id));
}

export async function isInMaintenanceWindow(serverId: string, now: number = Date.now()): Promise<boolean> {
  try {
    const items = await getMaintenanceWindows(serverId);
    const current = new Date(now);
    return items.some((item) => {
      if (!item.enabled) return false;
      if (item.schedule.startsWith("once:")) {
        const start = Number(item.schedule.slice(5));
        if (!Number.isFinite(start)) return false;
        const end = start + item.durationMinutes * 60000;
        return now >= start && now <= end;
      }
      if (!item.schedule.startsWith("cron:")) return false;
      return matchesCron(item.schedule.slice(5), current);
    });
  } catch (error) {
    console.warn(`[maintenance] parse error: ${String(error)}`);
    return false;
  }
}
