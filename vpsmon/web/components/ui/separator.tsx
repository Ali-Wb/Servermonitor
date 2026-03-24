import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Separator({ className, orientation = "horizontal", ...props }: HTMLAttributes<HTMLDivElement> & { orientation?: "horizontal" | "vertical" }) {
  return (
    <div
      aria-orientation={orientation}
      className={cn(
        "shrink-0 bg-[var(--color-border)]",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  );
}
