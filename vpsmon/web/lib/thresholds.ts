import path from "node:path";
import { z } from "zod";

import { atomicWrite, readJsonFile } from "@/lib/storage";

const FILE_PATH = path.resolve(process.env.VPSMON_THRESHOLDS_PATH ?? "./thresholds.json");
const ThresholdsSchema = z.record(z.string(), z.number());

export type Thresholds = z.infer<typeof ThresholdsSchema>;

export async function getThresholds(): Promise<Thresholds> {
  return ThresholdsSchema.parse(await readJsonFile<Thresholds>(FILE_PATH, {}));
}

export async function setThresholds(thresholds: Thresholds): Promise<Thresholds> {
  const next = ThresholdsSchema.parse(thresholds);
  await atomicWrite(FILE_PATH, next);
  return next;
}
