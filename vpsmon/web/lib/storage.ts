import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";

const JsonUnknownSchema = z.unknown();

export async function atomicWrite(filePath: string, data: unknown): Promise<void> {
  const resolvedPath = path.resolve(filePath);
  const directory = path.dirname(resolvedPath);
  const tmp = `${resolvedPath}.tmp.${process.pid}.${Date.now()}`;

  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, resolvedPath);
}

export async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.resolve(filePath), "utf8");
    return JsonUnknownSchema.parse(JSON.parse(raw)) as T;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return fallback;
    }

    throw error;
  }
}
