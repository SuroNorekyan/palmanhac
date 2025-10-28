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

const STORAGE_KEY = "palmanhac-age-verified";
const COOKIE_KEY = "ageVerified";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

const getInitialState = () => {
  if (typeof window === "undefined") return true;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "true") {
    return true;
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
      window.localStorage.setItem(STORAGE_KEY, "true");
      window.document.cookie = `${COOKIE_KEY}=true; path=/; max-age=${COOKIE_MAX_AGE}`;
    } catch (error) {
      console.warn("Unable to persist age gate approval", error);
    }
    setVerified(true);
  }, []);

  const deny = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
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
