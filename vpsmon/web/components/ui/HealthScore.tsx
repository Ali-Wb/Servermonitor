"use client";

// Health score badge with semantic threshold coloring and size variants.
// Score range is 0..100 and defaults to unknown display when absent.

import { cn } from "@/lib/utils";

interface HealthScoreProps {
  score?: number | null;
  size?: "sm" | "md" | "lg";
}

function colorClass(score: number): string {
  if (score >= 90) return "text-emerald-500";
  if (score >= 70) return "text-amber-500";
  return "text-destructive";
}

export function HealthScore({ score, size = "md" }: HealthScoreProps) {
  const sizeClass = size === "sm" ? "text-sm" : size === "lg" ? "text-3xl" : "text-xl";
  if (score == null || Number.isNaN(score)) {
    return <span className={cn("font-mono", sizeClass, "text-muted-foreground")}>—</span>;
  }
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return <span className={cn("font-mono font-semibold", sizeClass, colorClass(clamped))}>{clamped}</span>;
}
