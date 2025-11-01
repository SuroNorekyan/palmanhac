"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

type TwoFactorCopy = {
  setupTitle: string;
  setupDescription: string;
  generateSecret: string;
  qrLabel: string;
  manualCodeLabel: string;
  verificationLabel: string;
  verifyButton: string;
  recoveryCodesTitle: string;
  recoveryCodesDescription: string;
  success: string;
  error: string;
};

export function AdminTwoFactorSetup({
  en,
  pt,
  alreadyEnabled,
}: {
  en: TwoFactorCopy;
  pt: TwoFactorCopy;
  alreadyEnabled: boolean;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [verificationCode, setVerificationCode] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  const requestSetup = () => {
    startTransition(async () => {
      const response = await fetch("/api/admin/2fa/setup", {
        method: "POST",
      });
      if (!response.ok) {
        toast({
          title: en.error,
          description: pt.error,
          variant: "destructive",
        });
        return;
      }
      const payload = (await response.json()) as {
        qrCode: string;
        manualEntry: string;
      };
      setQrCode(payload.qrCode);
      setManualCode(payload.manualEntry);
      setRecoveryCodes(null);
      toast({
        title: en.generateSecret,
        description: pt.generateSecret,
        variant: "success",
      });
    });
  };

  const handleVerify = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const response = await fetch("/api/admin/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verificationCode }),
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

      const data = (await response.json()) as { recoveryCodes: string[] };
      setRecoveryCodes(data.recoveryCodes);
      toast({ title: en.success, description: pt.success, variant: "success" });
    });
  };

  return (
    <section className="space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold text-neutral-900">
          {en.setupTitle} / {pt.setupTitle}
        </h1>
        <p className="text-sm text-neutral-600">
          {en.setupDescription}
          <br />
          {pt.setupDescription}
        </p>
        {alreadyEnabled ? (
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            2FA ENABLED • 2FA ATIVA
          </p>
        ) : null}
      </header>
      <div className="space-y-4 rounded-3xl border border-[rgb(var(--border))] bg-white p-8 shadow-sm">
        <Button type="button" onClick={requestSetup} disabled={isPending}>
          {en.generateSecret} / {pt.generateSecret}
        </Button>
        {qrCode ? (
          <div className="grid gap-4 text-center">
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm font-medium text-neutral-700">
                {en.qrLabel}
                <br />
                {pt.qrLabel}
              </p>
              <Image
                src={qrCode}
                alt="2FA QR"
                width={220}
                height={220}
                className="rounded-xl border border-[rgb(var(--border))] bg-white p-4"
                unoptimized
              />
            </div>
            {manualCode ? (
              <div className="space-y-2">
                <p className="text-sm text-neutral-700">
                  {en.manualCodeLabel} / {pt.manualCodeLabel}
                </p>
                <code className="block rounded-xl bg-neutral-900 px-4 py-3 text-center text-sm font-semibold tracking-widest text-white">
                  {manualCode}
                </code>
              </div>
            ) : null}
          </div>
        ) : null}
        <form className="space-y-4" onSubmit={handleVerify}>
          <div>
            <Label htmlFor="two-fa-code">
              {en.verificationLabel} / {pt.verificationLabel}
            </Label>
            <Input
              id="two-fa-code"
              name="token"
              inputMode="numeric"
              required
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value)}
            />
          </div>
          <Button type="submit" disabled={isPending || !qrCode}>
            {en.verifyButton} / {pt.verifyButton}
          </Button>
        </form>
      </div>
      {recoveryCodes ? (
        <div className="space-y-4 rounded-3xl border border-[rgb(var(--border))] bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-neutral-900">
            {en.recoveryCodesTitle} / {pt.recoveryCodesTitle}
          </h2>
          <p className="text-sm text-neutral-600">
            {en.recoveryCodesDescription}
            <br />
            {pt.recoveryCodesDescription}
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {recoveryCodes.map((code) => (
              <li
                key={code}
                className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-2 text-center font-mono text-sm"
              >
                {code}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
