import type { InputHTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

export function RadioGroup({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={cn("grid gap-2", className)}>{children}</div>;
}

export function RadioGroupItem({ className, type = "radio", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("size-4 accent-[var(--color-primary)]", className)} type={type} {...props} />;
}
