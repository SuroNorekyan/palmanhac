// AdminNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Button } from "../ui/button";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/2fa/setup", label: "2FA" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <header className="flex flex-col gap-6 pt-8 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <p className="text-sm uppercase tracking-wide text-neutral-500">Palmanhac</p>
        <h1 className="text-3xl font-semibold text-neutral-900">Admin Console</h1>
        <p className="text-sm text-neutral-600">
          Manage products, monitor orders, and configure security for the Palmanhac store.
        </p>
      </div>

      <div className="flex flex-col items-start gap-3 md:items-end">
        <nav className="flex flex-wrap gap-2 md:justify-end">
          {links.map(({ href, label }) => {
            const isActive =
              pathname === href || (href !== "/admin" && pathname.startsWith(href));
            return (
              <Button
                asChild
                key={href}
                variant={isActive ? "secondary" : "outline"}
                className={clsx(
                  "rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition",
                  isActive && "bg-neutral-300 text-white hover:bg-neutral-500",
                )}
              >
                <Link href={href} aria-current={isActive ? "page" : undefined}>
                  {label}
                </Link>
              </Button>
            );
          })}
        </nav>

        <Link
          href="/"
          className="text-sm font-semibold text-neutral-900 underline-offset-4 hover:underline"
        >
          Back to storefront
        </Link>
      </div>
    </header>
  );
}
