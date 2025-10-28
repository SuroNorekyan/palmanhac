"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/format";

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode;
  badgeContent?: number;
  srLabel?: string;
};

export function IconButton({
  icon,
  badgeContent,
  srLabel,
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "relative flex h-11 w-11 items-center justify-center rounded-full border border-[rgb(var(--border))] bg-white text-neutral-900 transition hover:border-neutral-900 hover:bg-neutral-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-800",
        className,
      )}
      {...props}
    >
      {icon}
      {srLabel ? <span className="sr-only">{srLabel}</span> : null}
      {badgeContent && badgeContent > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[rgb(var(--accent))] px-1 text-xs font-semibold text-white">
          {badgeContent}
        </span>
      ) : null}
    </button>
  );
}
