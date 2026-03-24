"use client";

import type { HTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

export function ToastProvider({ children }: PropsWithChildren) { return <>{children}</>; }
export function ToastViewport({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cn("fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2", className)} {...props} />; }
export function Toast({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cn("rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-lg", className)} {...props} />; }
export function ToastTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) { return <h4 className={cn("font-semibold", className)} {...props} />; }
export function ToastDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) { return <p className={cn("text-sm text-[var(--color-muted-foreground)]", className)} {...props} />; }
export function ToastClose(props: HTMLAttributes<HTMLButtonElement>) { return <button type="button" {...props} />; }
export function ToastAction(props: HTMLAttributes<HTMLButtonElement>) { return <button type="button" {...props} />; }
