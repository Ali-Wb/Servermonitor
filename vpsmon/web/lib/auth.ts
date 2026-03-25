import { existsSync, readFileSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import bcrypt from "bcryptjs";

import { logAuthAttempt } from "@/lib/audit";
import { StoredKeySchema, type StoredKey } from "@/lib/schemas";
import { atomicWrite } from "@/lib/storage";

const KEY_STORE_PATH = path.resolve(process.env.VPSMON_KEYS_PATH ?? "./keys.json");
const CACHE_TTL_MS = 5000;

type AuthRole = "admin" | "readonly";

interface CachedKeys {
  expiresAt: number;
  keys: StoredKey[];
}

let cachedKeys: CachedKeys | null = null;

function getErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = Reflect.get(error, "code");
    return typeof code === "string" ? code : undefined;
  }

  return undefined;
}

async function getKeyStore(): Promise<StoredKey[]> {
  try {
    const raw = await fs.readFile(KEY_STORE_PATH, "utf8");
    const parsed = StoredKeySchema.array().safeParse(JSON.parse(raw));

    if (!parsed.success) {
      throw new Error(`[auth] invalid keys.json: ${parsed.error.message}`);
    }

    return parsed.data;
  } catch (error) {
    if (getErrorCode(error) === "ENOENT") {
      console.warn("[auth] keys.json deleted — auth disabled until restored");
      return [];
    }

    throw error;
  }
}

function getKeyStoreSync(): StoredKey[] {
  try {
    const raw = readFileSync(KEY_STORE_PATH, "utf8");
    return StoredKeySchema.array().parse(JSON.parse(raw));
  } catch (error) {
    if (getErrorCode(error) === "ENOENT") {
      console.warn("[auth] keys.json deleted — auth disabled until restored");
      return [];
    }

    throw error;
  }
}

async function saveKeyStore(keys: StoredKey[]): Promise<void> {
  await atomicWrite(KEY_STORE_PATH, keys);
  cachedKeys = {
    expiresAt: Date.now() + CACHE_TTL_MS,
    keys,
  };
}

function generatePlaintextKey(): string {
  return crypto.randomBytes(24).toString("base64url");
}

export function isAuthEnabled(): boolean {
  return Boolean(process.env.VPSMON_API_KEYS) || existsSync(KEY_STORE_PATH);
}

export async function verifyApiKey(key: string, ip: string, userAgent: string): Promise<AuthRole | null> {
  const store = await getKeyStore();

  if (store.length === 0 && !process.env.VPSMON_API_KEYS) {
    return "admin";
  }

  const now = Date.now();

  for (const entry of store) {
    if (entry.expiresAt !== null && now > entry.expiresAt) {
      await logAuthAttempt({
        id: crypto.randomUUID(),
        timestamp: now,
        ip,
        keyId: entry.id,
        keyLabel: entry.label,
        role: entry.role,
        success: false,
        userAgent,
      });
      continue;
    }

    const matches = await bcrypt.compare(key, entry.keyHash);
    if (matches) {
      const updated = store.map((item) =>
        item.id === entry.id ? { ...item, lastUsedAt: now } : item,
      );
      await saveKeyStore(updated);
      await logAuthAttempt({
        id: crypto.randomUUID(),
        timestamp: now,
        ip,
        keyId: entry.id,
        keyLabel: entry.label,
        role: entry.role,
        success: true,
        userAgent,
      });
      return entry.role as AuthRole;
    }
  }

  await logAuthAttempt({
    id: crypto.randomUUID(),
    timestamp: now,
    ip,
    keyId: undefined,
    keyLabel: undefined,
    role: undefined,
    success: false,
    userAgent,
  });
  return null;
}

export async function createKey(label: string, role: AuthRole, expiresAt?: number): Promise<{ id: string; plaintext: string }> {
  const plaintext = generatePlaintextKey();
  const now = Date.now();
  const store = await getKeyStore();
  const key: StoredKey = StoredKeySchema.parse({
    id: crypto.randomUUID(),
    label,
    keyHash: await bcrypt.hash(plaintext, 10),
    role,
    createdAt: now,
    expiresAt: expiresAt ?? null,
    lastUsedAt: null,
  });
  await saveKeyStore([key, ...store]);
  return { id: key.id, plaintext };
}

export async function revokeKey(id: string): Promise<void> {
  const store = await getKeyStore();
  await saveKeyStore(store.filter((item) => item.id !== id));
}

export function verifyApiKeyCached(key: string): AuthRole | null {
  if (!isAuthEnabled()) {
    return "admin";
  }

  const now = Date.now();
  if (!cachedKeys || cachedKeys.expiresAt <= now) {
    const keys = getKeyStoreSync();
    if (keys.length === 0) {
      return "admin";
    }
    cachedKeys = {
      expiresAt: now + CACHE_TTL_MS,
      keys,
    };
  }

  for (const entry of cachedKeys.keys) {
    if (entry.expiresAt !== null && now > entry.expiresAt) {
      continue;
    }

    if (bcrypt.compareSync(key, entry.keyHash)) {
      return entry.role as AuthRole;
    }
  }

  return null;
}

export async function listKeys(): Promise<StoredKey[]> {
  return getKeyStore();
}
