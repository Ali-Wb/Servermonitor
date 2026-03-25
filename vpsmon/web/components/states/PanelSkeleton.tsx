"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function PanelSkeleton() {
  return (
    <section className="rounded-lg border bg-card p-4">
      <Skeleton className="mb-3 h-4 w-32" />
      <Skeleton className="mb-2 h-8 w-20" />
      <Skeleton className="h-24 w-full" />
    </section>
  );
}
