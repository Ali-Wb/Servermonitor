import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Kbd({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <kbd className={cn("rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] px-2 py-1 font-mono text-xs", className)} {...props} />;
}
