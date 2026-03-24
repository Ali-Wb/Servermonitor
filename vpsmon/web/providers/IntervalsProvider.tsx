"use client";

import {
  createContext,
  type PropsWithChildren,
  useContext,
  useState,
} from "react";
import { z } from "zod";

const STORAGE_KEY = "vpsmon-intervals";

export const DEFAULT_INTERVALS: Record<string, number> = {
  cpu: 1000,
  ram: 2000,
  disk: 5000,
  network: 2000,
  processes: 5000,
  services: 10000,
  docker: 5000,
  gpu: 5000,
  fd: 10000,
  dns: 30000,
  healthchecks: 30000,
  alerts: 5000,
  bandwidth: 30000,
  uptime: 60000,
  logs: 10000,
  annotations: 15000,
  maintenance: 60000,
  groups: 30000,
  widgets: 10000,
  silences: 30000,
  shareTokens: 30000,
  agentHealth: 30000,
  snapshot: 2000,
  history: 5000,
  ping: 5000,
};

const StoredIntervalsSchema = z.record(z.string(), z.number());

export function safeGetIntervals(): Record<string, number> {
  if (typeof window === "undefined") return {};

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = StoredIntervalsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

interface IntervalsContextValue {
  getInterval: (panelId: string, defaultMs?: number) => number;
  setInterval: (panelId: string, ms: number) => void;
  intervals: Record<string, number>;
}

const IntervalsContext = createContext<IntervalsContextValue | undefined>(undefined);

export function IntervalsProvider({ children }: PropsWithChildren): React.JSX.Element {
  const [intervals, setIntervals] = useState<Record<string, number>>(() => safeGetIntervals());

  function getInterval(panelId: string, defaultMs: number = 30000): number {
    return intervals[panelId] ?? DEFAULT_INTERVALS[panelId] ?? defaultMs;
  }

  function setInterval(panelId: string, ms: number): void {
    setIntervals((current) => {
      const next = {
        ...current,
        [panelId]: ms,
      };

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Ignore storage errors and keep in-memory state.
        }
      }

      return next;
    });
  }

  return (
    <IntervalsContext.Provider value={{ getInterval, setInterval, intervals }}>
      {children}
    </IntervalsContext.Provider>
  );
}

export function useIntervals(): IntervalsContextValue {
  const context = useContext(IntervalsContext);

  if (!context) {
    throw new Error("useIntervals must be used within IntervalsProvider");
  }

  return context;
}
