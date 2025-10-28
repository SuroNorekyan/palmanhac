"use client";

import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { ToastProvider } from "@/components/ui/use-toast";
import { useCartStore } from "@/lib/store/cart";
import { useFavoritesStore } from "@/lib/store/favorites";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    useCartStore.persist.rehydrate?.();
    useFavoritesStore.persist.rehydrate?.();
  }, []);

  return (
    <ToastProvider>
      {children}
      <Toaster />
    </ToastProvider>
  );
}
