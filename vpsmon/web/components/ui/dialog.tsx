"use client";

import type { ButtonHTMLAttributes, HTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

export function Dialog({ children }: PropsWithChildren) { return <>{children}</>; }
export function DialogTrigger({ children }: PropsWithChildren) { return <>{children}</>; }
export function DialogPortal({ children }: PropsWithChildren) { return <>{children}</>; }
export function DialogClose(props: ButtonHTMLAttributes<HTMLButtonElement>) { return <button type="button" {...props} />; }
export function DialogOverlay({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cn("fixed inset-0 bg-black/50", className)} {...props} />; }
export function DialogContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cn("rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-xl", className)} {...props} />; }
export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />; }
export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cn("mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />; }
export function DialogTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) { return <h2 className={cn("text-lg font-semibold", className)} {...props} />; }
export function DialogDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) { return <p className={cn("text-sm text-[var(--color-muted-foreground)]", className)} {...props} />; }
