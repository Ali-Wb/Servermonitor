"use client";

import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Switch({ className, type = "checkbox", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("h-5 w-9 rounded-full accent-[var(--color-primary)]", className)} type={type} {...props} />;
}
