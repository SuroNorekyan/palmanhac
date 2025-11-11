"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils/format";

type ButtonVariant =
  | "default"
  | "outline"
  | "ghost"
  | "secondary"
  | "link"
  | "pill"
  | "outlineInverted";

type ButtonSize = "default" | "sm" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] hover:bg-[rgb(var(--primary))]/90",
  outline:
    "border border-[rgb(var(--border))] bg-white text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]/40",
  ghost: "text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]/50",
  secondary: "bg-neutral-900 text-white hover:bg-neutral-800",
  link: "text-[rgb(var(--primary))] underline-offset-4 hover:underline",
  pill: "rounded-full bg-[rgb(var(--accent))] px-6 text-[rgb(var(--accent-foreground))] hover:bg-[rgb(var(--accent))]/90",
  outlineInverted:
    "border border-white/80 bg-transparent text-white hover:border-white hover:bg-white/10",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-11 px-6 text-sm",
  sm: "h-9 rounded-md px-3 text-xs",
  lg: "h-12 rounded-lg px-8 text-base",
  icon: "h-10 w-10",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "default", size = "default", asChild = false, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        ref={ref as never}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button };
