"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

type DeleteOrderButtonProps = {
  orderId: string;
  orderLabel: string;
};

export function DeleteOrderButton({ orderId, orderLabel }: DeleteOrderButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/orders/${orderId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(payload?.error ?? "Unable to delete order.");
        }
        toast({ title: "Order deleted", variant: "success" });
        router.refresh();
      } catch (error) {
        console.error(error);
        toast({
          title: error instanceof Error ? error.message : "Unable to delete order.",
          variant: "destructive",
        });
      } finally {
        setConfirming(false);
      }
    });
  };

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="ghost"
        className="text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={() => setConfirming(true)}
      >
        Delete
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-neutral-600">Delete {orderLabel}?</span>
      <Button
        type="button"
        size="sm"
        className="bg-red-600 text-white hover:bg-red-700"
        disabled={isPending}
        onClick={handleDelete}
      >
        Confirm
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={isPending}
        onClick={() => setConfirming(false)}
      >
        Cancel
      </Button>
    </div>
  );
}
