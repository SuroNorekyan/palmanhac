import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { ProductBaseForm } from "@/components/admin/products/ProductBaseForm";
import { prisma } from "@/lib/server/db";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ id: string }>;
};

export default async function AdminProductBasePage({ params }: Params) {
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
      baseEn: true,
      basePt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Edit base</h1>
          <p className="text-sm text-neutral-600">
            Provide the product base in English and Portuguese for {product.name}.
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
            href={`/admin/products/${product.id}`}
            className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
          >
            Back to product
          </Link>
        </div>
      </header>
      <div className="rounded-3xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm">
        <ProductBaseForm product={product} />
      </div>
    </div>
  );
}
