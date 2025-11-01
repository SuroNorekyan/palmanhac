"use client";

import { useEffect, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

type AdminProduct = {
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
};

type ProductFormState = {
  id?: number;
  name: string;
  slug: string;
  category: string;
  price: string;
  image: string;
  galleryImages: string;
  volumeMl: string;
  abv: string;
  stock: string;
  descriptionEn: string;
  descriptionPt: string;
  isActive: boolean;
};

const emptyForm: ProductFormState = {
  name: "",
  slug: "",
  category: "",
  price: "",
  image: "",
  galleryImages: "",
  volumeMl: "700",
  abv: "40",
  stock: "0",
  descriptionEn: "",
  descriptionPt: "",
  isActive: true,
};

const formatPrice = (cents: number) => (cents / 100).toFixed(2);
const parsePrice = (value: string) => Math.round(Number.parseFloat(value) * 100);

export function AdminProductManager() {
  const { toast } = useToast();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, startTransition] = useTransition();

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/products?includeInactive=true", {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Failed to load products");
      }
      const payload = (await response.json()) as { products: AdminProduct[] };
      setProducts(payload.products);
    } catch (error) {
      console.error(error);
      toast({
        title: "Failed to load products / Falha ao carregar produtos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const resetForm = () => setForm(emptyForm);

  const handleEdit = (product: AdminProduct) => {
    setForm({
      id: product.id,
      name: product.name,
      slug: product.slug,
      category: product.category,
      price: formatPrice(product.priceCents),
      image: product.image,
      galleryImages: product.galleryImages.join(", "),
      volumeMl: product.volumeMl.toString(),
      abv: product.abv.toString(),
      stock: product.stock.toString(),
      descriptionEn: product.descriptionEn,
      descriptionPt: product.descriptionPt,
      isActive: product.isActive,
    });
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Delete this product permanently? / Eliminar este produto permanentemente?",
    );
    if (!confirmed) {
      return;
    }
    const response = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      toast({
        title: payload?.error ?? "Unable to delete / Não foi possível eliminar",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Product deleted / Produto eliminado",
      variant: "success",
    });
    void loadProducts();
    resetForm();
  };

  const handleChange = (field: keyof ProductFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      try {
        const payload = {
          name: form.name,
          slug: form.slug.trim() || undefined,
          category: form.category,
          priceCents: parsePrice(form.price || "0"),
          image: form.image,
          galleryImages: form.galleryImages
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          volumeMl: Number.parseInt(form.volumeMl, 10) || 0,
          abv: Number.parseFloat(form.abv) || 0,
          stock: Number.parseInt(form.stock, 10) || 0,
          isActive: form.isActive,
          description: {
            en: form.descriptionEn,
            pt: form.descriptionPt,
          },
        };

        const response = await fetch(
          form.id ? `/api/admin/products/${form.id}` : "/api/admin/products",
          {
            method: form.id ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );

        if (!response.ok) {
          const result = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(result?.error ?? "Unknown error");
        }

        toast({
          title: form.id
            ? "Product updated / Produto atualizado"
            : "Product created / Produto criado",
          variant: "success",
        });
        void loadProducts();
        resetForm();
      } catch (error) {
        console.error(error);
        toast({
          title: "Failed to save product / Falha ao guardar produto",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-900">Products / Produtos</h2>
          <p className="text-sm text-neutral-600">
            Manage catalog entries across languages / Gerir catálogo em ambos os idiomas
          </p>
        </div>
        <Button variant="outline" onClick={resetForm}>
          New Product / Novo produto
        </Button>
      </header>
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="space-y-3 rounded-3xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm">
          {isLoading ? (
            <p className="text-sm text-neutral-600">Loading… / A carregar…</p>
          ) : products.length === 0 ? (
            <p className="text-sm text-neutral-600">
              No products yet / Ainda sem produtos
            </p>
          ) : (
            <ul className="space-y-3">
              {products.map((product) => (
                <li
                  key={product.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-neutral-900">{product.name}</p>
                    <p className="text-xs text-neutral-500">
                      {product.slug} • {formatPrice(product.priceCents)} €
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(product)}>
                      Edit / Editar
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <form
          className="space-y-4 rounded-3xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm"
          onSubmit={handleSubmit}
        >
          <h3 className="text-xl font-semibold text-neutral-900">
            {form.id
              ? "Update product / Atualizar produto"
              : "Create product / Criar produto"}
          </h3>
          <div className="grid gap-3">
            <div>
              <Label htmlFor="product-name">Name / Nome</Label>
              <Input
                id="product-name"
                value={form.name}
                required
                onChange={(event) => handleChange("name", event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="product-slug">Slug</Label>
              <Input
                id="product-slug"
                value={form.slug}
                placeholder="auto"
                onChange={(event) => handleChange("slug", event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="product-category">Category / Categoria</Label>
              <Input
                id="product-category"
                value={form.category}
                required
                onChange={(event) => handleChange("category", event.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="product-price">Price €</Label>
                <Input
                  id="product-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  required
                  onChange={(event) => handleChange("price", event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="product-volume">Volume ml</Label>
                <Input
                  id="product-volume"
                  type="number"
                  min="0"
                  value={form.volumeMl}
                  onChange={(event) => handleChange("volumeMl", event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="product-abv">ABV %</Label>
                <Input
                  id="product-abv"
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.abv}
                  onChange={(event) => handleChange("abv", event.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="product-stock">Stock</Label>
              <Input
                id="product-stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={(event) => handleChange("stock", event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="product-image">Image URL</Label>
              <Input
                id="product-image"
                value={form.image}
                required
                onChange={(event) => handleChange("image", event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="product-gallery">Gallery (comma separated)</Label>
              <Input
                id="product-gallery"
                value={form.galleryImages}
                onChange={(event) => handleChange("galleryImages", event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="product-description-en">Description EN</Label>
              <Textarea
                id="product-description-en"
                value={form.descriptionEn}
                rows={4}
                required
                onChange={(event) => handleChange("descriptionEn", event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="product-description-pt">Descrição PT</Label>
              <Textarea
                id="product-description-pt"
                value={form.descriptionPt}
                rows={4}
                required
                onChange={(event) => handleChange("descriptionPt", event.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="product-active"
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => handleChange("isActive", event.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
              />
              <Label htmlFor="product-active">Active / Ativo</Label>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {form.id ? "Update / Atualizar" : "Create / Criar"}
            </Button>
            {form.id ? (
              <Button type="button" variant="ghost" onClick={resetForm}>
                Cancel / Cancelar
              </Button>
            ) : null}
          </div>
        </form>
      </div>
    </section>
  );
}
