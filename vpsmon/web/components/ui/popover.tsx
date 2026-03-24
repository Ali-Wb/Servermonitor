"use client";

import type { HTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

export function Popover({ children }: PropsWithChildren) { return <>{children}</>; }
export function PopoverTrigger({ children }: PropsWithChildren) { return <>{children}</>; }
export function PopoverContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cn("rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-lg", className)} {...props} />; }
