import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { DeleteProductButton } from "@/components/admin/products/DeleteProductButton";
import { ProductForm } from "@/components/admin/products/ProductForm";
import { prisma } from "@/lib/server/db";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ id: string }>;
};

export default async function AdminProductEditPage({ params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/account");
  }
  if (session.user.twoFAEnabled && !(session as any).twoFAVerified) {
    redirect("/admin/2fa/challenge");
  }

  const { id } = await params;
  const productId = Number.parseInt(id, 10);
  if (!Number.isInteger(productId)) {
    notFound();
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      namePt: true,
      slug: true,
      category: true,
      priceCents: true,
      image: true,
      galleryImages: true,
      volumeMl: true,
      vol: true,
      stock: true,
      isActive: true,
      baseEn: true,
      basePt: true,
      descriptionEn: true,
      descriptionPt: true,
      createdAt: true,
      updatedAt: true,
      discountEnabled: true,
      discountPercent: true,
    },
  });

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Edit product</h1>
          <p className="text-sm text-neutral-600">
            Update catalogue details or adjust stock levels for {product.name}.
          </p>
          <p className="text-xs text-neutral-500">
            #{product.id} • Created {product.createdAt.toLocaleDateString("en-GB")} •
            Updated{" "}
            {product.updatedAt.toLocaleString("en-GB", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/products"
            className="text-sm font-semibold text-neutral-900 underline-offset-4 hover:underline"
          >
            Back to products
          </Link>
          <DeleteProductButton
            productId={product.id}
            productName={product.name}
            redirectTo="/admin/products"
          />
        </div>
      </header>
      <div className="rounded-3xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm">
        <ProductForm mode="edit" product={product} />
      </div>
    </div>
  );
}
