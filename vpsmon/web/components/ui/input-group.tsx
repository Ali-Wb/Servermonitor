import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function InputGroup({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center overflow-hidden rounded-lg border border-[var(--color-border)] bg-transparent", className)} {...props} />;
}

export function InputGroupAddon({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-3 text-sm text-[var(--color-muted-foreground)]", className)} {...props} />;
}
