"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export function DeleteProductButton({
  productId,
  productName,
  redirectTo,
}: {
  productId: number;
  productName: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/products/${productId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(payload?.error ?? "Unable to delete product.");
        }
        toast({ title: "Product deleted", variant: "success" });
        if (redirectTo) {
          router.push(redirectTo);
        }
        router.refresh();
      } catch (error) {
        console.error(error);
        toast({
          title: error instanceof Error ? error.message : "Unable to delete product.",
          variant: "destructive",
        });
      } finally {
        setConfirmationOpen(false);
      }
    });
  };

  if (!confirmationOpen) {
    return (
      <Button
        type="button"
        variant="ghost"
        className="text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={() => setConfirmationOpen(true)}
      >
        Delete
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-neutral-600">Delete {productName}?</span>
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
        onClick={() => setConfirmationOpen(false)}
      >
        Cancel
      </Button>
    </div>
  );
}
