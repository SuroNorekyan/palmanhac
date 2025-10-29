"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Dictionary } from "@/lib/i18n/dictionaries";

const STORAGE_KEY = "palmanhac-age-consent";
const LEGACY_STORAGE_KEYS = ["palmanhac-age-verified"];
const COOKIE_KEY = "ageVerified";
const CONSENT_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const COOKIE_MAX_AGE = CONSENT_TTL_MS / 1000;

const persistConsent = () => {
  if (typeof window === "undefined") {
    return;
  }
  const payload = JSON.stringify({ expiresAt: Date.now() + CONSENT_TTL_MS });
  window.localStorage.setItem(STORAGE_KEY, payload);
  LEGACY_STORAGE_KEYS.forEach((key) => {
    window.localStorage.removeItem(key);
  });
  window.document.cookie = `${COOKIE_KEY}=true; path=/; max-age=${COOKIE_MAX_AGE}`;
};

const clearConsent = () => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
  LEGACY_STORAGE_KEYS.forEach((key) => {
    window.localStorage.removeItem(key);
  });
  window.document.cookie = `${COOKIE_KEY}=; path=/; max-age=0`;
};

const getInitialState = () => {
  if (typeof window === "undefined") return true;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) {
    if (stored === "true") {
      try {
        persistConsent();
      } catch (error) {
        console.warn("Unable to refresh legacy age gate consent", error);
      }
      return true;
    }

    try {
      const parsed = JSON.parse(stored) as { expiresAt?: number };
      if (typeof parsed.expiresAt === "number" && parsed.expiresAt > Date.now()) {
        return true;
      }
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn("Unable to read stored age gate consent", error);
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  for (const legacyKey of LEGACY_STORAGE_KEYS) {
    const legacyStored = window.localStorage.getItem(legacyKey);
    if (legacyStored === "true") {
      try {
        persistConsent();
      } catch (error) {
        console.warn("Unable to refresh legacy age gate consent", error);
      }
      return true;
    }
  }

  const cookies = window.document.cookie.split(";");
  return cookies.some((cookie) => cookie.trim().startsWith(`${COOKIE_KEY}=true`));
};

export function AgeGate({
  copy,
  locale,
}: {
  copy: Dictionary["ageGate"];
  locale: string;
}) {
  const router = useRouter();
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    setVerified(getInitialState());
  }, []);

  const approve = useCallback(() => {
    try {
      persistConsent();
    } catch (error) {
      console.warn("Unable to persist age gate approval", error);
    }
    setVerified(true);
  }, []);

  const deny = useCallback(() => {
    try {
      clearConsent();
    } catch (error) {
      console.warn("Unable to update age gate storage", error);
    }
    setVerified(false);
    router.replace(`/${locale}/age-gate-denied`);
  }, [locale, router]);

  if (verified === null) {
    return null;
  }

  return (
    <Dialog open={!verified}>
      <DialogContent aria-describedby="age-gate-description" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="text-3xl font-semibold">{copy.title}</DialogTitle>
          <DialogDescription id="age-gate-description" className="text-base">
            {copy.description}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 flex items-center justify-center gap-4">
          <Button variant="pill" className="min-w-[120px]" onClick={approve}>
            {copy.confirm}
          </Button>
          <Button variant="outline" className="min-w-[120px]" onClick={deny}>
            {copy.deny}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
