"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

type TwoFactorCopy = {
  challengeTitle: string;
  challengeDescription: string;
  verificationLabel: string;
  recoveryCodeLabel: string;
  submitButton: string;
  success: string;
  error: string;
};

export function AdminTwoFactorChallenge({
  en,
  pt,
}: {
  en: TwoFactorCopy;
  pt: TwoFactorCopy;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({ token: "", recoveryCode: "" });
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const response = await fetch("/api/admin/2fa/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: form.token || undefined,
          recoveryCode: form.recoveryCode || undefined,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        toast({
          title: payload?.error ?? en.error,
          description: pt.error,
          variant: "destructive",
        });
        return;
      }

      toast({ title: en.success, description: pt.success, variant: "success" });
      router.push("/admin");
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-xl space-y-6 rounded-3xl border border-[rgb(var(--border))] bg-white p-8 shadow-sm"
    >
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold text-neutral-900">
          {en.challengeTitle} / {pt.challengeTitle}
        </h1>
        <p className="text-sm text-neutral-600">
          {en.challengeDescription} <br /> {pt.challengeDescription}
        </p>
      </header>
      <div className="space-y-4">
        <div>
          <Label htmlFor="two-fa-token">
            {en.verificationLabel} / {pt.verificationLabel}
          </Label>
          <Input
            id="two-fa-token"
            name="token"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={form.token}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, token: event.target.value }))
            }
          />
        </div>
        <div>
          <Label htmlFor="two-fa-recovery">
            {en.recoveryCodeLabel} / {pt.recoveryCodeLabel}
          </Label>
          <Input
            id="two-fa-recovery"
            name="recoveryCode"
            value={form.recoveryCode}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, recoveryCode: event.target.value }))
            }
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {en.submitButton} / {pt.submitButton}
      </Button>
    </form>
  );
}
