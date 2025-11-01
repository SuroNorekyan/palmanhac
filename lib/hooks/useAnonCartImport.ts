"use client";

import { useEffect } from "react";
import { useCartStore } from "@/lib/store/cart";

type SessionStatus = "authenticated" | "unauthenticated" | "loading";

export const ANON_CART_FLAG_KEY = "pal:import-anon-cart-once";
export const ANON_CART_PAYLOAD_KEY = "pal:anon-cart-snapshot";
export const ANON_CART_EXPIRES_KEY = "pal:anon-cart-expires";

type UseAnonCartImportOptions = {
  status: SessionStatus;
  userId?: string | null;
};

export function useAnonCartImport({ status, userId }: UseAnonCartImportOptions) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (status !== "authenticated" || !userId) {
      return;
    }

    const shouldImport = window.sessionStorage.getItem(ANON_CART_FLAG_KEY);
    if (!shouldImport) {
      return;
    }

    const expiresRaw = window.sessionStorage.getItem(ANON_CART_EXPIRES_KEY);
    const expiresAt = Number(expiresRaw);
    if (Number.isFinite(expiresAt) && expiresAt < Date.now()) {
      window.sessionStorage.removeItem(ANON_CART_FLAG_KEY);
      window.sessionStorage.removeItem(ANON_CART_PAYLOAD_KEY);
      window.sessionStorage.removeItem(ANON_CART_EXPIRES_KEY);
      return;
    }

    const snapshot = window.sessionStorage.getItem(ANON_CART_PAYLOAD_KEY);
    window.sessionStorage.removeItem(ANON_CART_FLAG_KEY);
    window.sessionStorage.removeItem(ANON_CART_PAYLOAD_KEY);
    window.sessionStorage.removeItem(ANON_CART_EXPIRES_KEY);

    if (!snapshot) {
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(snapshot);
    } catch (error) {
      console.error("Failed to parse anonymous cart snapshot", error);
      return;
    }

    if (!Array.isArray(parsed)) {
      return;
    }

    const normalized = parsed
      .map((entry) => ({
        productId: Number((entry as { productId?: unknown }).productId),
        quantity: Number((entry as { quantity?: unknown }).quantity),
      }))
      .filter(
        (entry) =>
          Number.isInteger(entry.productId) &&
          entry.productId > 0 &&
          Number.isInteger(entry.quantity) &&
          entry.quantity > 0 &&
          entry.quantity <= 99,
      );

    if (!normalized.length) {
      return;
    }

    const cartStore = useCartStore.getState();
    cartStore.clear();
    normalized.forEach((item) => cartStore.addItem(item.productId, item.quantity));
  }, [status, userId]);
}
