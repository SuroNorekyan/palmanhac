// app/admin/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { defaultLocale } from "@/config/site";
import { prisma } from "@/lib/server/db";
import { formatCurrency } from "@/lib/utils/currency";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await auth();

  // Fallback guard (middleware already enforces this)
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect(`/${defaultLocale}/account?callbackUrl=/admin`);
  }

  if (session.user.twoFAEnabled && !(session as any).twoFAVerified) {
    redirect("/admin/2fa/challenge");
  }

  const [productCount, activeProducts, orderCount, pendingPayment, recentOrders] =
    await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.order.count({ where: { paymentStatus: { in: ["UNPAID", "PENDING"] } } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          totalAmount: true,
          paymentStatus: true,
          paymentMethod: true,
          taxId: true,
          createdAt: true,
          contactEmail: true,
          isGuest: true,
          user: { select: { name: true, email: true } },
        },
      }),
    ]);

  return (
    <div className="space-y-10">
      <section className="grid gap-4 rounded-3xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm md:grid-cols-2 xl:grid-cols-4">
        <DashboardStat
          title="Products"
          value={productCount.toString()}
          helper={`${activeProducts} active`}
        />
        <DashboardStat
          title="Orders"
          value={orderCount.toString()}
          helper={`${pendingPayment} awaiting payment`}
        />
        <DashboardStat
          title="Two-factor"
          value={session.user.twoFAEnabled ? "Enabled" : "Disabled"}
          helper={session.user.twoFAEnabled ? "Secured" : "Enable for admins"}
        />
        <DashboardStat
          title="Admin email"
          value={session.user.email ?? session.user.id}
          helper="Signed in"
        />
      </section>

      <section className="space-y-4 rounded-3xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">Recent orders</h2>
            <p className="text-sm text-neutral-600">
              Latest five orders placed across the store.
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="text-sm font-semibold text-neutral-900 underline-offset-4 hover:underline"
          >
            View all orders
          </Link>
        </header>

        {recentOrders.length === 0 ? (
          <p className="text-sm text-neutral-600">No orders recorded yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {recentOrders.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="space-y-1">
                  <p className="font-semibold text-neutral-900">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-sm text-neutral-600">
                    {order.user?.name ??
                      order.user?.email ??
                      order.contactEmail ??
                      "Guest"}
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
                <div className="text-right text-sm text-neutral-600">
                  <p className="font-semibold text-neutral-900">
                    {formatCurrency("en", order.totalAmount)}
                  </p>
                  <p>
                    {order.paymentStatus} · {order.paymentMethod ?? "EUPAGO"}
                  </p>
                  <p className="text-xs">
                    {order.createdAt.toLocaleString("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-4 rounded-3xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm md:grid-cols-2">
        <QuickLinkCard
          title="Manage products"
          description="Create, update or remove catalogue entries across languages."
          href="/admin/products"
          cta="Open products"
        />
        <QuickLinkCard
          title="Monitor orders"
          description="Review payment status, shipping notes, and audit activity."
          href="/admin/orders"
          cta="Open orders"
        />
      </section>
    </div>
  );
}

function DashboardStat({
  title,
  value,
  helper,
}: {
  title: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="space-y-1 rounded-2xl border border-neutral-100 bg-neutral-50 p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-neutral-500 wrap-break-word">
        {title}
      </p>

      <p
        className="text-2xl font-semibold text-neutral-900 wrap-break-word whitespace-normal leading-tight max-w-full"
        style={{ wordBreak: "break-word" }}
      >
        {value}
      </p>

      <p className="text-xs text-neutral-600 wrap-break-word whitespace-normal max-w-full leading-snug">
        {helper}
      </p>
    </div>
  );
}

function QuickLinkCard({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-neutral-100 bg-neutral-50 p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
      <p className="text-sm text-neutral-600">{description}</p>
      <Link
        href={href}
        className="text-sm font-semibold text-neutral-900 underline-offset-4 hover:underline"
      >
        {cta}
      </Link>
    </div>
  );
}
