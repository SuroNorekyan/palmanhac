import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ADMIN_PAGE_SIZE, AdminPagination } from "@/components/admin/AdminPagination";
import { DeleteProductButton } from "@/components/admin/products/DeleteProductButton";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/server/db";
import { formatCurrency } from "@/lib/utils/currency";

export const dynamic = "force-dynamic";

type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminProductsPage({ searchParams }: ProductsPageProps) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/account");
  }
  if (session.user.twoFAEnabled && !(session as any).twoFAVerified) {
    redirect("/admin/2fa/challenge");
  }

  const resolvedParams = (await searchParams) ?? {};
  const pageParam = Array.isArray(resolvedParams.page)
    ? resolvedParams.page[0]
    : resolvedParams.page;
  const currentPage = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const skip = (currentPage - 1) * ADMIN_PAGE_SIZE;

  const [products, totalProducts] = await Promise.all([
    prisma.product.findMany({
      orderBy: { updatedAt: "desc" },
      skip,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        slug: true,
        priceCents: true,
        stock: true,
        isActive: true,
        updatedAt: true,
        createdAt: true,
      },
    }),
    prisma.product.count(),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Products</h1>
          <p className="text-sm text-neutral-600">
            Manage catalogue entries, pricing, and availability across languages.
          </p>
        </div>
        <Button asChild variant="pill">
          <Link href="/admin/products/new">New product</Link>
        </Button>
      </header>
      <div className="overflow-hidden rounded-3xl border border-[rgb(var(--border))] bg-white shadow-sm">
        <table className="min-w-full divide-y divide-neutral-100 text-sm">
          <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-6 text-center text-sm text-neutral-600"
                >
                  No products yet. Create your first product to populate the catalogue.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="font-semibold text-neutral-900 underline-offset-4 hover:underline"
                      >
                        {product.name}
                      </Link>
                      <p className="text-xs text-neutral-500">#{product.id}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-600">/{product.slug}</td>
                  <td className="px-4 py-3 font-semibold text-neutral-900">
                    {formatCurrency("en", product.priceCents)}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-600">{product.stock}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        product.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {product.isActive ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500">
                    {product.updatedAt.toLocaleString("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="text-sm font-semibold text-neutral-900 underline-offset-4 hover:underline"
                      >
                        Edit
                      </Link>
                      <DeleteProductButton
                        productId={product.id}
                        productName={product.name}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <AdminPagination
        page={currentPage}
        totalItems={totalProducts}
        basePath="/admin/products"
        searchParams={resolvedParams}
      />
    </div>
  );
}
