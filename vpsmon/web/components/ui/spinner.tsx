import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Spinner({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("size-5 animate-spin rounded-full border-2 border-[var(--color-muted-foreground)] border-t-[var(--color-primary)]", className)} {...props} />;
}
