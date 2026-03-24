import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Progress({ className, value = 0, ...props }: HTMLAttributes<HTMLDivElement> & { value?: number }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-[var(--color-muted)]", className)} {...props}>
      <div className="h-full bg-[var(--color-primary)] transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
