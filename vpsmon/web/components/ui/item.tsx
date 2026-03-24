import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Item({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4", className)} {...props} />;
}
