"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Paperclip } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/format";
import { getEffectivePriceCents } from "@/lib/utils/pricing";

const slugPattern = /^[a-z0-9-]+$/;

// accept http(s) or root-relative /assets/... (or /images/...)
const imagePathRegex = /^\/(assets|images)\/[^\s]+$/i;
const imageUrlOrPath = z
  .string()
  .trim()
  .refine(
    (v) => {
      if (!v) return false;
      if (imagePathRegex.test(v)) return true;
      try {
        const u = new URL(v);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Enter a valid image URL or a path like /assets/file.png" },
  );

const CATEGORY_OPTIONS = ["licor", "aguardente", "bebida-espirituosa"] as const;
const CATEGORY_LABELS: Record<(typeof CATEGORY_OPTIONS)[number], string> = {
  licor: "Licor",
  aguardente: "Aguardente",
  "bebida-espirituosa": "Bebida Espirituosa",
};

const productFormSchema = z.object({
  name: z.string().min(2, "English name is required"),
  namePt: z.string().min(2, "Portuguese name is required"),
  slug: z
    .string()
    .trim()
    .regex(slugPattern, "Slug must use lowercase letters, numbers or hyphens.")
    .optional()
    .or(z.literal("")),
  category: z
    .string()
    .refine(
      (value) => CATEGORY_OPTIONS.includes(value as (typeof CATEGORY_OPTIONS)[number]),
      "Select a category",
    ),
  price: z
    .string()
    .min(1, "Price is required")
    .refine((value) => {
      const parsed = Number.parseFloat(value.replace(",", "."));
      return Number.isFinite(parsed) && parsed >= 0;
    }, "Enter a valid price"),
  image: imageUrlOrPath,
  galleryImages: z.string().optional(),
  baseEn: z.string().min(1, "Base (EN) is required"),
  basePt: z.string().min(1, "Base (PT) is required"),
  volumeMl: z.string().refine(
    (value) => {
      if (!value.trim()) return true;
      const parsed = Number.parseInt(value, 10);
      return Number.isInteger(parsed) && parsed >= 0;
    },
    { message: "Enter a valid volume in ml" },
  ),
  vol: z.string().refine(
    (value) => {
      if (!value.trim()) return true;
      const parsed = Number.parseFloat(value.replace(",", "."));
      return Number.isFinite(parsed) && parsed >= 0;
    },
    { message: "Enter a valid VOL" },
  ),
  stock: z.string().refine(
    (value) => {
      if (!value.trim()) return true;
      const parsed = Number.parseInt(value, 10);
      return Number.isInteger(parsed) && parsed >= 0;
    },
    { message: "Enter a valid stock quantity" },
  ),
  descriptionEn: z.string().min(1, "Provide an English description"),
  descriptionPt: z.string().min(1, "Forneça a descrição em português"),
  isActive: z.boolean(),
  discountEnabled: z.boolean(),
  discountPercent: z.string().refine(
    (value) => {
      const parsed = Number.parseInt(value, 10);
      return Number.isInteger(parsed) && parsed >= 0 && parsed <= 99;
    },
    { message: "Enter a discount between 0 and 99" },
  ),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

type ProductFormProps = {
  mode: "create" | "edit";
  product?: {
    id: number;
    name: string;
    namePt: string;
    slug: string;
    category: string;
    priceCents: number;
    image: string;
    galleryImages: string[];
    volumeMl: number;
    vol: number;
    stock: number;
    baseEn: string;
    basePt: string;
    isActive: boolean;
    descriptionEn: string;
    descriptionPt: string;
    discountEnabled: boolean;
    discountPercent: number;
  } | null;
};

export function ProductForm({ mode, product }: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormValues, string>>>(
    {},
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormValues>({
    name: product?.name ?? "",
    namePt: product?.namePt ?? "",
    slug: product?.slug ?? "",
    category: product?.category ?? "",
    price: product ? (product.priceCents / 100).toFixed(2) : "",
    image: product?.image ?? "",
    galleryImages: product?.galleryImages?.join(", ") ?? "",
    baseEn: product?.baseEn ?? "",
    basePt: product?.basePt ?? "",
    volumeMl: product?.volumeMl?.toString() ?? "",
    vol: product?.vol?.toString() ?? "",
    stock: product?.stock?.toString() ?? "",
    descriptionEn: product?.descriptionEn ?? "",
    descriptionPt: product?.descriptionPt ?? "",
    isActive: product?.isActive ?? true,
    discountEnabled: product?.discountEnabled ?? false,
    discountPercent: (product?.discountPercent ?? 0).toString(),
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const previewPriceCents = (() => {
    const normalized = form.price?.replace(",", ".") ?? "";
    const value = Number.parseFloat(normalized);
    if (!Number.isFinite(value) || value < 0) {
      return 0;
    }
    return Math.round(value * 100);
  })();

  const draftDiscountPercent = (() => {
    const parsed = Number.parseInt(form.discountPercent, 10);
    if (!Number.isInteger(parsed) || parsed < 0) {
      return 0;
    }
    return Math.min(parsed, 99);
  })();

  const previewEffectiveCents = getEffectivePriceCents({
    priceCents: previewPriceCents,
    discountEnabled: form.discountEnabled,
    discountPercent: draftDiscountPercent,
  });
  const previewHasDiscount = form.discountEnabled && draftDiscountPercent > 0;

  const handleChange = <Field extends keyof ProductFormValues>(
    field: Field,
    value: ProductFormValues[Field],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const parseGallery = (v: string | undefined) =>
    (v ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const handleDiscountToggle = (checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      discountEnabled: checked,
      discountPercent: checked ? (prev.discountPercent ?? "0") : "0",
    }));
  };

  const handleAttachClick = () => fileInputRef.current?.click();

  const handleFileChosen = async (file: File | null) => {
    if (!file) return;
    setSubmitError(null);
    try {
      const data = new FormData();
      data.append("file", file);

      console.groupCollapsed("[ProductForm] Upload image");
      console.log("name:", file.name, "size:", file.size, "type:", file.type);
      console.groupEnd();

      const res = await fetch("/api/admin/upload", { method: "POST", body: data });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "Failed to upload file");
      }
      const json = (await res.json()) as { path?: string; url?: string };
      const uploadPath = json.path || json.url;
      if (!uploadPath) {
        throw new Error("Upload did not return a valid path.");
      }
      handleChange("image", uploadPath);
      if (!form.galleryImages?.trim()) handleChange("galleryImages", uploadPath);
      toast({ title: "Image uploaded", variant: "success" });
    } catch (e) {
      console.error(e);
      setSubmitError(e instanceof Error ? e.message : "Failed to upload the image.");
      toast({ title: "Image upload failed", variant: "destructive" });
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setSubmitError(null);

    const parsed = productFormSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const formatted: Partial<Record<keyof ProductFormValues, string>> = {};
      (Object.keys(fieldErrors) as Array<keyof ProductFormValues>).forEach((key) => {
        const message = fieldErrors[key]?.[0];
        if (message) formatted[key] = message;
      });
      setErrors(formatted);
      setSubmitError("Please fix the highlighted fields.");
      return;
    }

    startTransition(async () => {
      try {
        const galleryImagesRaw = parseGallery(parsed.data.galleryImages);
        const priceFloat = Number.parseFloat(parsed.data.price.replace(",", "."));
        const priceCents = Math.round(priceFloat * 100);
        if (!Number.isFinite(priceCents) || priceCents < 0) {
          throw new Error("Unable to parse price.");
        }
        const discountPercentValue = parsed.data.discountEnabled
          ? Number.parseInt(parsed.data.discountPercent, 10)
          : 0;

        // Match server contract: structured JSON payload
        const payload = {
          name: parsed.data.name,
          namePt: parsed.data.namePt,
          slug: parsed.data.slug?.trim() || undefined,
          category: parsed.data.category,
          priceCents,
          image: parsed.data.image,
          galleryImages: galleryImagesRaw.length ? galleryImagesRaw : [parsed.data.image],
          volumeMl: Number.parseInt(parsed.data.volumeMl || "0", 10) || 0,
          vol: Number.parseFloat(parsed.data.vol || "0") || 0,
          stock: Number.parseInt(parsed.data.stock || "0", 10) || 0,
          isActive: parsed.data.isActive,
          discountEnabled: parsed.data.discountEnabled && discountPercentValue > 0,
          discountPercent: discountPercentValue,
          description: {
            en: parsed.data.descriptionEn,
            pt: parsed.data.descriptionPt,
          },
          base: {
            en: parsed.data.baseEn,
            pt: parsed.data.basePt,
          },
          // Server wants strings, not nulls:
          tastingNotes: {
            en: "",
            pt: "",
          },
        };

        console.groupCollapsed("[ProductForm] Submitting");
        console.log("mode:", mode);
        console.log("payload:", payload);
        console.groupEnd();

        const response = await fetch(
          mode === "create"
            ? "/api/admin/products"
            : `/api/admin/products/${product?.id}`,
          {
            method: mode === "create" ? "POST" : "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );

        const text = await response.text().catch(() => "");
        let result: any = null;
        try {
          result = text ? JSON.parse(text) : null;
        } catch {
          /* non-JSON error */
        }

        if (!response.ok) {
          console.groupCollapsed("[ProductForm] Error response");
          console.log("status:", response.status);
          console.log("body:", text);
          console.groupEnd();

          const apiMessage =
            result?.error ||
            result?.message ||
            (typeof result === "string" ? result : null) ||
            "Failed to save product.";
          setSubmitError(apiMessage);

          if (result?.fieldErrors && typeof result.fieldErrors === "object") {
            const mapped: Partial<Record<keyof ProductFormValues, string>> = {};
            if (result.fieldErrors.image?.[0]) mapped.image = result.fieldErrors.image[0];
            if (result.fieldErrors.galleryImages?.[0])
              mapped.galleryImages = result.fieldErrors.galleryImages[0];
            if (result.fieldErrors.description?.[0]) {
              mapped.descriptionEn = result.fieldErrors.description[0];
              mapped.descriptionPt = result.fieldErrors.description[0];
            }
            if (result.fieldErrors.base?.[0]) {
              mapped.baseEn = result.fieldErrors.base[0];
              mapped.basePt = result.fieldErrors.base[0];
            }
            if (result.fieldErrors.tastingNotes?.[0]) {
              // We don't have dedicated inputs for notes, bubble to banner
              setSubmitError((prev) =>
                prev
                  ? `${prev} • ${result.fieldErrors.tastingNotes[0]}`
                  : result.fieldErrors.tastingNotes[0],
              );
            }
            setErrors((prev) => ({ ...prev, ...mapped }));
          }

          throw new Error(apiMessage);
        }

        toast({
          title: mode === "create" ? "Product created" : "Product updated",
          variant: "success",
        });

        router.push("/admin/products");
        router.refresh();
      } catch (error) {
        console.error(error);
        toast({
          title: error instanceof Error ? error.message : "Failed to save product.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      {submitError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {submitError}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name (EN)" error={errors.name}>
          <Input
            className={cn(errors.name && "ring-1 ring-red-500")}
            required
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
          />
        </Field>

        <Field label="Nome (PT)" error={errors.namePt}>
          <Input
            className={cn(errors.namePt && "ring-1 ring-red-500")}
            required
            value={form.namePt}
            onChange={(e) => handleChange("namePt", e.target.value)}
          />
        </Field>

        <Field label="Slug" helper="Leave blank to auto-generate." error={errors.slug}>
          <Input
            className={cn(errors.slug && "ring-1 ring-red-500")}
            placeholder="automatic"
            value={form.slug}
            onChange={(e) => handleChange("slug", e.target.value)}
          />
        </Field>

        <Field label="Category" error={errors.category}>
          <select
            className={cn(
              "w-full appearance-none rounded-xl border border-[rgb(var(--border))] bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10",
              errors.category && "ring-1 ring-red-500",
            )}
            required
            value={form.category}
            onChange={(e) => handleChange("category", e.target.value)}
          >
            <option value="" disabled hidden>
              Select a category
            </option>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {CATEGORY_LABELS[option]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Price (€)" error={errors.price}>
          <Input
            className={cn(errors.price && "ring-1 ring-red-500")}
            type="number"
            min="0"
            step="0.01"
            required
            value={form.price}
            onChange={(e) => handleChange("price", e.target.value)}
          />
        </Field>

        <div className="rounded-2xl border border-[rgb(var(--border))] bg-neutral-50/60 p-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="product-discount"
              className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
              checked={form.discountEnabled}
              onChange={(e) => handleDiscountToggle(e.target.checked)}
            />
            <Label
              htmlFor="product-discount"
              className="text-sm font-semibold text-neutral-800"
            >
              Apply discount
            </Label>
          </div>
          {form.discountEnabled ? (
            <div className="mt-4 max-w-[180px]">
              <Field label="Discount (%)" error={errors.discountPercent}>
                <Input
                  className={cn(errors.discountPercent && "ring-1 ring-red-500")}
                  type="number"
                  min="0"
                  max="99"
                  value={form.discountPercent}
                  onChange={(e) => handleChange("discountPercent", e.target.value)}
                />
              </Field>
            </div>
          ) : null}
          <div className="mt-4 flex items-center gap-3 text-sm font-semibold">
            <span className={cn(previewHasDiscount && "text-neutral-400 line-through")}>
              {formatCurrency("en", previewPriceCents)}
            </span>
            {previewHasDiscount ? (
              <>
                <span className="text-neutral-400">→</span>
                <span className="text-emerald-600">
                  {formatCurrency("en", previewEffectiveCents)}
                </span>
              </>
            ) : (
              <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                No discount
              </span>
            )}
          </div>
        </div>

        <Field label="Image" helper="URL or /assets/file.png" error={errors.image}>
          <div className="flex items-center gap-2">
            <Input
              className={cn("flex-1", errors.image && "ring-1 ring-red-500")}
              required
              value={form.image}
              onChange={(e) => handleChange("image", e.target.value)}
              placeholder="https://... or /assets/bottle.png"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleAttachClick}
              title="Upload to /public/assets"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChosen(e.target.files?.[0] ?? null)}
            />
          </div>
        </Field>

        <Field label="Gallery URLs" helper="Comma-separated" error={errors.galleryImages}>
          <Input
            className={cn(errors.galleryImages && "ring-1 ring-red-500")}
            value={form.galleryImages ?? ""}
            onChange={(e) => handleChange("galleryImages", e.target.value)}
          />
        </Field>

        <Field label="Volume (ml)" error={errors.volumeMl}>
          <Input
            className={cn(errors.volumeMl && "ring-1 ring-red-500")}
            type="number"
            min="0"
            value={form.volumeMl}
            onChange={(e) => handleChange("volumeMl", e.target.value)}
          />
        </Field>

        <Field label="VOL (%)" error={errors.vol}>
          <Input
            className={cn(errors.vol && "ring-1 ring-red-500")}
            type="number"
            min="0"
            step="0.1"
            value={form.vol}
            onChange={(e) => handleChange("vol", e.target.value)}
          />
        </Field>

        <Field label="Stock" error={errors.stock}>
          <Input
            className={cn(errors.stock && "ring-1 ring-red-500")}
            type="number"
            min="0"
            value={form.stock}
            onChange={(e) => handleChange("stock", e.target.value)}
          />
        </Field>

        <div className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            id="product-active"
            className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
            checked={form.isActive}
            onChange={(e) => handleChange("isActive", e.target.checked)}
          />
          <Label htmlFor="product-active">Active</Label>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Base (EN)" error={errors.baseEn}>
          <Textarea
            className={cn(errors.baseEn && "ring-1 ring-red-500")}
            required
            rows={4}
            value={form.baseEn}
            onChange={(e) => handleChange("baseEn", e.target.value)}
            placeholder="e.g. Fresh oranges"
          />
        </Field>
        <Field label="Base (PT)" error={errors.basePt}>
          <Textarea
            className={cn(errors.basePt && "ring-1 ring-red-500")}
            required
            rows={4}
            value={form.basePt}
            onChange={(e) => handleChange("basePt", e.target.value)}
            placeholder="ex.: Laranjas frescas"
          />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Description (EN)" error={errors.descriptionEn}>
          <Textarea
            className={cn(errors.descriptionEn && "ring-1 ring-red-500")}
            required
            rows={6}
            value={form.descriptionEn}
            onChange={(e) => handleChange("descriptionEn", e.target.value)}
          />
        </Field>
        <Field label="Descrição (PT)" error={errors.descriptionPt}>
          <Textarea
            className={cn(errors.descriptionPt && "ring-1 ring-red-500")}
            required
            rows={6}
            value={form.descriptionPt}
            onChange={(e) => handleChange("descriptionPt", e.target.value)}
          />
        </Field>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button type="submit" disabled={isPending}>
          {mode === "create" ? "Create product" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

type FieldProps = {
  label: string;
  helper?: string;
  error?: string;
  children: React.ReactNode;
};

function Field({ label, helper, error, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-neutral-800">{label}</Label>
      {children}
      {helper ? <p className="text-xs text-neutral-500">{helper}</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
