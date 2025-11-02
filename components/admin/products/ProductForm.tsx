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
import { cn } from "@/lib/utils/format";

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

// convert root-relative -> absolute (server requires absolute)
const toAbsoluteUrl = (v: string) => {
  if (!v) return v;
  if (typeof window !== "undefined" && v.startsWith("/")) {
    return `${window.location.origin}${v}`;
  }
  return v;
};

const productFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z
    .string()
    .trim()
    .regex(slugPattern, "Slug must use lowercase letters, numbers or hyphens.")
    .optional()
    .or(z.literal("")),
  category: z.string().min(2, "Category is required"),
  price: z
    .string()
    .min(1, "Price is required")
    .refine((value) => {
      const parsed = Number.parseFloat(value.replace(",", "."));
      return Number.isFinite(parsed) && parsed >= 0;
    }, "Enter a valid price"),
  image: imageUrlOrPath,
  galleryImages: z.string().optional(),
  volumeMl: z.string().refine(
    (value) => {
      if (!value.trim()) return true;
      const parsed = Number.parseInt(value, 10);
      return Number.isInteger(parsed) && parsed >= 0;
    },
    { message: "Enter a valid volume in ml" },
  ),
  abv: z.string().refine(
    (value) => {
      if (!value.trim()) return true;
      const parsed = Number.parseFloat(value.replace(",", "."));
      return Number.isFinite(parsed) && parsed >= 0;
    },
    { message: "Enter a valid ABV" },
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
});

type ProductFormValues = z.infer<typeof productFormSchema>;

type ProductFormProps = {
  mode: "create" | "edit";
  product?: {
    id: number;
    name: string;
    slug: string;
    category: string;
    priceCents: number;
    image: string;
    galleryImages: string[];
    volumeMl: number;
    abv: number;
    stock: number;
    isActive: boolean;
    descriptionEn: string;
    descriptionPt: string;
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
    slug: product?.slug ?? "",
    category: product?.category ?? "",
    price: product ? (product.priceCents / 100).toFixed(2) : "",
    image: product?.image ?? "",
    galleryImages: product?.galleryImages?.join(", ") ?? "",
    volumeMl: product?.volumeMl?.toString() ?? "",
    abv: product?.abv?.toString() ?? "",
    stock: product?.stock?.toString() ?? "",
    descriptionEn: product?.descriptionEn ?? "",
    descriptionPt: product?.descriptionPt ?? "",
    isActive: product?.isActive ?? true,
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      const json = (await res.json()) as { path: string };
      handleChange("image", json.path);
      if (!form.galleryImages?.trim()) handleChange("galleryImages", json.path);
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
        const galleryImagesAbs = galleryImagesRaw.map(toAbsoluteUrl);
        const priceFloat = Number.parseFloat(parsed.data.price.replace(",", "."));
        const priceCents = Math.round(priceFloat * 100);
        if (!Number.isFinite(priceCents) || priceCents < 0) {
          throw new Error("Unable to parse price.");
        }

        // Match server contract: absolute URLs + object fields
        const payload = {
          name: parsed.data.name,
          slug: parsed.data.slug?.trim() || undefined,
          category: parsed.data.category,
          priceCents,
          image: toAbsoluteUrl(parsed.data.image),
          galleryImages: galleryImagesAbs.length
            ? galleryImagesAbs
            : [toAbsoluteUrl(parsed.data.image)],
          volumeMl: Number.parseInt(parsed.data.volumeMl || "0", 10) || 0,
          abv: Number.parseFloat(parsed.data.abv || "0") || 0,
          stock: Number.parseInt(parsed.data.stock || "0", 10) || 0,
          isActive: parsed.data.isActive,
          description: {
            en: parsed.data.descriptionEn,
            pt: parsed.data.descriptionPt,
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
        <Field label="Name" error={errors.name}>
          <Input
            className={cn(errors.name && "ring-1 ring-red-500")}
            required
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
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
          <Input
            className={cn(errors.category && "ring-1 ring-red-500")}
            required
            value={form.category}
            onChange={(e) => handleChange("category", e.target.value)}
          />
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

        <Field label="ABV (%)" error={errors.abv}>
          <Input
            className={cn(errors.abv && "ring-1 ring-red-500")}
            type="number"
            min="0"
            step="0.1"
            value={form.abv}
            onChange={(e) => handleChange("abv", e.target.value)}
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
