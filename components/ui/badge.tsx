import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/format";

export type BadgeVariant = "default" | "outline" | "muted";

const variantStyles: Record<BadgeVariant, string> = {
  default:
    "bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))] border-transparent",
  outline: "border border-[rgb(var(--border))] bg-white text-[rgb(var(--foreground))]",
  muted: "bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))] border-transparent",
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
