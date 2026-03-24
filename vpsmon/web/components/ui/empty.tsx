import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Empty({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-muted-foreground)]", className)} {...props} />;
}
