"use client";

import type { HTMLAttributes, PropsWithChildren, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function TooltipProvider({ children }: PropsWithChildren) {
  return <>{children}</>;
}

export function Tooltip({ children }: PropsWithChildren) {
  return <>{children}</>;
}

export function TooltipTrigger({ children }: PropsWithChildren) {
  return <>{children}</>;
}

export function TooltipContent({
  className,
  children,
}: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-sm text-[var(--color-card-foreground)] shadow-md",
        className,
      )}
    >
      {children}
    </div>
  );
}
