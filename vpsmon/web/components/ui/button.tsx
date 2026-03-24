import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = {
  default: "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90",
  secondary: "bg-[var(--color-muted)] text-[var(--color-card-foreground)] hover:bg-[color-mix(in_srgb,var(--color-muted)_85%,white)]",
  outline: "border border-[var(--color-border)] bg-transparent hover:bg-[var(--color-muted)]",
  ghost: "hover:bg-[var(--color-muted)]",
  destructive: "bg-[var(--color-destructive)] text-white hover:opacity-90",
} as const;

const buttonSizes = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-md px-3",
  lg: "h-11 rounded-md px-8",
  icon: "size-10",
} as const;

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
};

export function Button({
  className,
  variant = "default",
  size = "default",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:pointer-events-none disabled:opacity-50",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      type={type}
      {...props}
    />
  );
}
