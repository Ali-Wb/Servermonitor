import path from "node:path";

import { AuditEntrySchema, type AuditEntry } from "@/lib/schemas";
import { atomicWrite, readJsonFile } from "@/lib/storage";

const AUDIT_PATH = process.env.VPSMON_AUDIT_PATH ?? "./audit.json";
const RETENTION_DAYS = Number(process.env.VPSMON_AUDIT_RETENTION_DAYS ?? "90");
const ANONYMIZE_IPS = (process.env.VPSMON_AUDIT_ANONYMIZE_IPS ?? "true") !== "false";
const AUDIT_ENABLED = (process.env.VPSMON_AUDIT_ENABLED ?? "true") !== "false";

function anonymizeIp(ip: string): string {
  if (!ANONYMIZE_IPS) {
    return ip;
  }

  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
  }

  if (ip.includes(":")) {
    const parts = ip.split(":");
    return `${parts.slice(0, 4).join(":")}::`;
  }

  return ip;
}

export async function logAuthAttempt(entry: AuditEntry): Promise<void> {
  if (!AUDIT_ENABLED) {
    return;
  }

  const parsed = AuditEntrySchema.safeParse({
    ...entry,
    ip: anonymizeIp(entry.ip),
  });

  if (!parsed.success) {
    throw new Error(`[audit] invalid audit entry: ${parsed.error.message}`);
  }

  const existing = await readJsonFile<AuditEntry[]>(path.resolve(AUDIT_PATH), []);
  const now = Date.now();
  const cutoff = now - RETENTION_DAYS * 86_400 * 1000;
  const next = [parsed.data, ...existing].filter((item) => item.timestamp >= cutoff);

  await atomicWrite(path.resolve(AUDIT_PATH), next);
}

export async function getAuditLog(limit: number = 100): Promise<AuditEntry[]> {
  const existing = await readJsonFile<AuditEntry[]>(path.resolve(AUDIT_PATH), []);
  return existing.slice(0, limit).map((entry) => AuditEntrySchema.parse(entry));
}
