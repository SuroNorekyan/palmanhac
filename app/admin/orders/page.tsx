import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { ADMIN_PAGE_SIZE, AdminPagination } from "@/components/admin/AdminPagination";
import { DeleteOrderButton } from "@/components/admin/orders/DeleteOrderButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { defaultLocale } from "@/config/site";
import { prisma } from "@/lib/server/db";
import { formatCurrency } from "@/lib/utils/currency";

export const dynamic = "force-dynamic";

type OrdersPageProps = {
  // 🔧 Next.js 15: searchParams is a Promise
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminOrdersPage({ searchParams }: OrdersPageProps) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect(`/${defaultLocale}/account?callbackUrl=/admin/orders`);
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
  const searchQueryRaw =
    typeof resolvedParams.q === "string"
      ? resolvedParams.q.trim()
      : Array.isArray(resolvedParams.q)
        ? resolvedParams.q[0]?.trim()
        : "";
  const searchQuery = searchQueryRaw || "";
  const whereClause: Prisma.OrderWhereInput = searchQuery
    ? {
        OR: [
          { id: { contains: searchQuery, mode: "insensitive" as const } },
          { providerRef: { contains: searchQuery, mode: "insensitive" as const } },
          { contactEmail: { contains: searchQuery, mode: "insensitive" as const } },
          { contactPhone: { contains: searchQuery, mode: "insensitive" as const } },
          {
            user: {
              OR: [
                { name: { contains: searchQuery, mode: "insensitive" as const } },
                { email: { contains: searchQuery, mode: "insensitive" as const } },
              ],
            },
          },
        ],
      }
    : {};

  const [orders, totalOrders] = await Promise.all([
    prisma.order.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        paymentProvider: true,
        paidAt: true,
        totalAmount: true,
        createdAt: true,
        taxId: true,
        contactEmail: true,
        isGuest: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.order.count({ where: whereClause }),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Orders</h1>
          <p className="text-sm text-neutral-600">
            Track payment status, customer details, and fulfilment progress.
          </p>
        </div>
      </header>
      <form className="flex flex-col gap-2 sm:flex-row sm:items-center" method="GET">
        <Input
          name="q"
          defaultValue={searchQuery}
          placeholder="Search by order ID, customer, or email"
          className="sm:max-w-xs"
        />
        <div className="flex gap-2">
          <Button type="submit" variant="secondary">
            Search
          </Button>
          {searchQuery ? (
            <Button type="button" variant="ghost" asChild>
              <Link href="/admin/orders">Clear</Link>
            </Button>
          ) : null}
        </div>
      </form>
      <div className="overflow-hidden rounded-3xl border border-[rgb(var(--border))] bg-white shadow-sm">
        <table className="min-w-full divide-y divide-neutral-100 text-sm">
          <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Paid at</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {orders.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-6 text-center text-sm text-neutral-600"
                >
                  No orders yet.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-semibold text-neutral-900 underline-offset-4 hover:underline"
                      >
                        #{order.id.slice(0, 8).toUpperCase()}
                      </Link>
                      <p className="text-xs text-neutral-500">
                        {order.status} ·{" "}
                        {order.createdAt.toLocaleString("en-GB", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-600">
                    <div className="space-y-1">
                      <p className="font-medium text-neutral-900">
                        {order.user?.name ?? (order.isGuest ? "Guest checkout" : "—")}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {order.user?.email ?? order.contactEmail ?? "—"}
                      </p>
                      {order.isGuest ? (
                        <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                          Guest order
                        </span>
                      ) : null}
                      {order.taxId ? (
                        <p className="text-xs text-neutral-500">NIF/TIN: {order.taxId}</p>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-neutral-900">
                    {formatCurrency("en", order.totalAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        order.paymentStatus === "PAID"
                          ? "bg-emerald-100 text-emerald-700"
                          : order.paymentStatus === "FAILED"
                            ? "bg-red-100 text-red-700"
                            : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-600">
                    {order.paymentMethod ?? order.paymentProvider ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500">
                    {order.paidAt
                      ? order.paidAt.toLocaleString("en-GB", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-sm font-semibold text-neutral-900 underline-offset-4 hover:underline"
                      >
                        View
                      </Link>
                      <DeleteOrderButton
                        orderId={order.id}
                        orderLabel={`#${order.id.slice(0, 8).toUpperCase()}`}
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
        totalItems={totalOrders}
        basePath="/admin/orders"
        searchParams={resolvedParams}
      />
    </div>
  );
}
