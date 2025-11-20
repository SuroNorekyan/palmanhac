"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils/format";
import { useToast, type ToastVariant } from "./use-toast";

const iconMap: Record<ToastVariant, ReactNode> = {
  default: <Info className="h-5 w-5" />,
  success: <CheckCircle2 className="h-5 w-5 text-green-600" />,
  destructive: <AlertCircle className="h-5 w-5 text-red-500" />,
};

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center sm:justify-end">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="pointer-events-auto"
          >
            <div
              role="status"
              className={cn(
                "mb-3 flex w-[min(360px,90vw)] items-start gap-3 rounded-2xl border border-[rgb(var(--border))] bg-white p-4 text-left shadow-lg transition hover:border-neutral-800",
                toast.variant === "destructive" && "border-red-200 bg-red-50",
                toast.variant === "success" && "border-green-200 bg-green-50",
              )}
            >
              <span className="mt-0.5 shrink-0 text-neutral-700">
                {iconMap[toast.variant ?? "default"]}
              </span>
              <span className="flex-1 space-y-1">
                <span className="block text-sm font-semibold text-neutral-900">
                  {toast.title}
                </span>
                {toast.description ? (
                  <span className="block text-xs text-neutral-500">
                    {toast.description}
                  </span>
                ) : null}
              </span>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="ml-2 rounded-full p-1 text-xs font-semibold text-neutral-500 transition hover:bg-neutral-900/10 hover:text-neutral-900"
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
