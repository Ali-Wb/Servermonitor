"use client";

import { PanelSkeleton } from "@/components/states/PanelSkeleton";

export function PageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <PanelSkeleton />
        <PanelSkeleton />
        <PanelSkeleton />
        <PanelSkeleton />
      </div>
    </div>
  );
}
