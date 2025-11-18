"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import type { Locale } from "@/config/site";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { useCartStore } from "@/lib/store/cart";
import { useFavoritesStore } from "@/lib/store/favorites";
import { withLocale } from "@/lib/utils/locale";

type DashboardProps = {
  dictionary: Dictionary;
  locale: Locale;
  user: {
    id: string;
    name: string | null | undefined;
    email: string | null | undefined;
    role?: string | null;
  };
};

export function AccountDashboard({ dictionary, locale, user }: DashboardProps) {
  const { toast } = useToast();
  const clearCartStore = useCartStore((state) => state.clear);
  const clearFavoritesStore = useFavoritesStore((state) => state.clear);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isPending, startTransition] = useTransition();

  const updateField =
    (field: "currentPassword" | "newPassword" | "confirmPassword") =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handlePasswordChange = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast({
        title: dictionary.account.alerts.passwordMismatch,
        description: dictionary.account.passwordHint,
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        toast({
          title: payload?.error ?? dictionary.account.alerts.loginFailed,
          variant: "destructive",
        });
        return;
      }

      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({
        title: dictionary.account.dashboard.success,
        variant: "success",
      });
    });
  };

  const handleSignOut = () => {
    clearCartStore();
    clearFavoritesStore();
    void signOut({ callbackUrl: withLocale(locale, "/") });
  };

  return (
    <section className="space-y-10">
      <header className="space-y-2">
        <p className="text-sm text-neutral-500">
          {dictionary.account.dashboard.manageAccount}
        </p>
        <h1 className="text-3xl font-semibold text-neutral-900">
          {dictionary.account.dashboard.greeting} {user.name ?? user.email ?? "Palmanhac"}
        </h1>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href={withLocale(locale, "/orders")}>
              {dictionary.account.dashboard.viewOrders}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={withLocale(locale, "/favorites")}>
              {dictionary.account.dashboard.viewFavorites}
            </Link>
          </Button>
          <Button variant="ghost" onClick={handleSignOut}>
            {dictionary.account.logout}
          </Button>
          {(user.role ?? "").toUpperCase() === "ADMIN" ? (
            <Button asChild variant="outline">
              <Link href="/admin">Go to Admin Panel</Link>
            </Button>
          ) : null}
        </div>
      </header>
      <form
        className="space-y-4 rounded-3xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm"
        onSubmit={handlePasswordChange}
      >
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">
            {dictionary.account.dashboard.changePassword}
          </h2>
          <p className="text-sm text-neutral-600">
            {dictionary.account.dashboard.changePasswordDescription}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="current-password">
              {dictionary.account.dashboard.currentPassword}
            </Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              required
              value={form.currentPassword}
              onChange={updateField("currentPassword")}
            />
          </div>
          <div>
            <Label htmlFor="new-password">
              {dictionary.account.dashboard.newPassword}
            </Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              value={form.newPassword}
              onChange={updateField("newPassword")}
            />
          </div>
          <div>
            <Label htmlFor="confirm-new-password">
              {dictionary.account.dashboard.confirmPassword}
            </Label>
            <Input
              id="confirm-new-password"
              type="password"
              autoComplete="new-password"
              required
              value={form.confirmPassword}
              onChange={updateField("confirmPassword")}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-neutral-500">{dictionary.account.passwordHint}</p>
          <Button type="submit" disabled={isPending}>
            {dictionary.account.dashboard.submit}
          </Button>
        </div>
      </form>
    </section>
  );
}
