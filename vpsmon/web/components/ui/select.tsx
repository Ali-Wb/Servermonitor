"use client";

import type { HTMLAttributes, OptionHTMLAttributes, PropsWithChildren, SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("flex h-10 w-full rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm", className)} {...props}>{children}</select>;
}
export function SelectTrigger({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cn("flex h-10 items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm", className)} {...props} />; }
export function SelectContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cn("rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-1 shadow-lg", className)} {...props} />; }
export function SelectItem({ className, ...props }: OptionHTMLAttributes<HTMLOptionElement>) { return <option className={cn(className)} {...props} />; }
export function SelectValue({ children }: PropsWithChildren) { return <>{children}</>; }
export function SelectGroup({ children }: PropsWithChildren) { return <>{children}</>; }
export function SelectLabel({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cn("px-2 py-1.5 text-xs font-semibold", className)} {...props} />; }
export function SelectSeparator({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cn("-mx-1 my-1 h-px bg-[var(--color-border)]", className)} {...props} />; }
