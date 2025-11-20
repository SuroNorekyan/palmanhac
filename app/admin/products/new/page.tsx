import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ProductForm } from "@/components/admin/products/ProductForm";

export const dynamic = "force-dynamic";

export default async function AdminProductCreatePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/account");
  }
  if (session.user.twoFAEnabled && !(session as any).twoFAVerified) {
    redirect("/admin/2fa/challenge");
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Create product</h1>
          <p className="text-sm text-neutral-600">
            Define multilingual copy, pricing, and inventory for a new catalogue entry.
          </p>
        </div>
        <Link
          href="/admin/products"
          className="text-sm font-semibold text-neutral-900 underline-offset-4 hover:underline"
        >
          Back to products
        </Link>
      </header>
      <div className="rounded-3xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm">
        <ProductForm mode="create" />
      </div>
    </div>
  );
}
