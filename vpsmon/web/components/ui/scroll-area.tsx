import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function ScrollArea({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("relative overflow-auto", className)} {...props} />;
}

export function ScrollBar({ className, orientation = "vertical", ...props }: HTMLAttributes<HTMLDivElement> & { orientation?: "horizontal" | "vertical" }) {
  return <div className={cn(orientation === "vertical" ? "w-2" : "h-2", className)} {...props} />;
}
