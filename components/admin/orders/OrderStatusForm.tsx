"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const ORDER_STATUS_OPTIONS = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
] as const;
const PAYMENT_STATUS_OPTIONS = [
  "UNPAID",
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
] as const;

type OrderStatusFormProps = {
  orderId: string;
  status: (typeof ORDER_STATUS_OPTIONS)[number];
  paymentStatus: (typeof PAYMENT_STATUS_OPTIONS)[number];
  notes?: string | null;
};

export function OrderStatusForm({
  orderId,
  status,
  paymentStatus,
  notes,
}: OrderStatusFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [statusValue, setStatusValue] = useState(status);
  const [paymentStatusValue, setPaymentStatusValue] = useState(paymentStatus);
  const [notesValue, setNotesValue] = useState(notes ?? "");
  const [isPending, startTransition] = useTransition();

  const isReadOnly = paymentStatus === "PAID";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isReadOnly) {
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: statusValue,
            paymentStatus: paymentStatusValue,
            notes: notesValue.trim() || null,
          }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(payload?.error ?? "Failed to update order.");
        }

        toast({ title: "Order updated", variant: "success" });
        router.refresh();
      } catch (error) {
        console.error(error);
        toast({
          title: error instanceof Error ? error.message : "Failed to update order.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {isReadOnly ? (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          This order is paid and cannot be modified.
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="order-status">Order status</Label>
          <select
            id="order-status"
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
            value={statusValue}
            onChange={(event) =>
              setStatusValue(event.target.value as (typeof ORDER_STATUS_OPTIONS)[number])
            }
            disabled={isPending || isReadOnly}
          >
            {ORDER_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="payment-status">Payment status</Label>
          <select
            id="payment-status"
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
            value={paymentStatusValue}
            onChange={(event) =>
              setPaymentStatusValue(
                event.target.value as (typeof PAYMENT_STATUS_OPTIONS)[number],
              )
            }
            disabled={isPending || isReadOnly}
          >
            {PAYMENT_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="order-notes">Internal notes</Label>
          <Textarea
            id="order-notes"
            rows={3}
            value={notesValue}
            onChange={(event) => setNotesValue(event.target.value)}
            disabled={isPending || isReadOnly}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || isReadOnly}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
