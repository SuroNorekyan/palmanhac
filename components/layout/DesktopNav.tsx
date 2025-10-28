"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import type { NavItem } from "@/config/nav";
import type { Locale } from "@/config/site";
import { withLocale } from "@/lib/utils/locale";

export function DesktopNav({ items, locale }: { items: NavItem[]; locale: Locale }) {
  const pathname = usePathname();
  const [hovered, setHovered] = useState<string | null>(null);

  const activeHref = useMemo(() => {
    if (!pathname) return null;
    const trimmed = pathname.replace(/\/$/, "");
    const withoutLocale = trimmed.replace(/^\/[a-z]{2}(?=\/|$)/, "");
    const normalized = withoutLocale === "" ? "/" : withoutLocale;
    const found = items.find((item) => normalized === item.href);
    return found?.href ?? null;
  }, [pathname, items]);

  return (
    <nav className="hidden items-center gap-6 lg:flex">
      {items.map((item) => {
        const isActive = hovered ? hovered === item.href : activeHref === item.href;
        return (
          <Link
            key={item.href}
            href={withLocale(locale, item.href)}
            className="relative px-1 text-sm font-medium text-neutral-600 transition hover:text-neutral-900"
            onFocus={() => setHovered(item.href)}
            onMouseEnter={() => setHovered(item.href)}
            onMouseLeave={() => setHovered(null)}
            onBlur={() => setHovered(null)}
          >
            {item.label}
            {isActive ? (
              <motion.span
                layoutId="nav-underline"
                className="absolute -bottom-1 left-0 h-[2px] w-full rounded-full bg-neutral-900"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
