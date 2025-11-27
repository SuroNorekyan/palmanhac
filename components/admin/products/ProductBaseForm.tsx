"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils/format";

export function ProductBaseForm({
  product,
}: {
  product: { id: number; name: string; baseEn: string; basePt: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    en: product.baseEn ?? "",
    pt: product.basePt ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (locale: "en" | "pt", value: string) => {
    setForm((prev) => ({ ...prev, [locale]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const en = form.en.trim();
      const pt = form.pt.trim();
      if (!en || !pt) {
        setError("Please provide the base in both English and Portuguese.");
        return;
      }
      try {
        const response = await fetch(`/api/admin/products/${product.id}/base`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base: { en, pt } }),
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(payload?.error || "Failed to update product base.");
        }
        toast({ title: "Base updated", description: product.name, variant: "success" });
        router.refresh();
      } catch (err) {
        console.error("[ProductBaseForm] Failed to update base", err);
        setError(err instanceof Error ? err.message : "Unable to update base.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="base-en" className="text-sm font-semibold text-neutral-800">
            Base (EN)
          </Label>
          <Input
            id="base-en"
            value={form.en}
            onChange={(event) => handleChange("en", event.target.value)}
            className={cn(!form.en.trim() && error && "ring-1 ring-red-500")}
            placeholder="e.g. Fresh oranges"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="base-pt" className="text-sm font-semibold text-neutral-800">
            Base (PT)
          </Label>
          <Input
            id="base-pt"
            value={form.pt}
            onChange={(event) => handleChange("pt", event.target.value)}
            className={cn(!form.pt.trim() && error && "ring-1 ring-red-500")}
            placeholder="ex.: Laranjas frescas"
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          Save base
        </Button>
      </div>
    </form>
  );
}
