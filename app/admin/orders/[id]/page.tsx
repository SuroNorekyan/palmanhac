import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { DeleteOrderButton } from "@/components/admin/orders/DeleteOrderButton";
import { OrderStatusForm } from "@/components/admin/orders/OrderStatusForm";
import { defaultLocale } from "@/config/site";
import { prisma } from "@/lib/server/db";
import { formatCurrency } from "@/lib/utils/currency";

export const dynamic = "force-dynamic";

// 🔧 Next.js 15: params is a Promise
type Props = {
  params: Promise<{ id: string }>;
};

type Address = {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
};

type OrderEventRecord = {
  type?: string;
  createdAt?: string;
  payload?: Record<string, unknown>;
};

const parseAddress = (value: Prisma.JsonValue | null): Address | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const address = value as Record<string, unknown>;
  return {
    name: typeof address.name === "string" ? address.name : undefined,
    line1: typeof address.line1 === "string" ? address.line1 : undefined,
    line2: typeof address.line2 === "string" ? address.line2 : undefined,
    city: typeof address.city === "string" ? address.city : undefined,
    postalCode: typeof address.postalCode === "string" ? address.postalCode : undefined,
    country: typeof address.country === "string" ? address.country : undefined,
  };
};

const parseEvents = (value: Prisma.JsonValue | null): OrderEventRecord[] => {
  if (!Array.isArray(value)) return [];
  const events: OrderEventRecord[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const record = entry as Record<string, unknown>;
    events.push({
      type: typeof record.type === "string" ? record.type : undefined,
      createdAt: typeof record.createdAt === "string" ? record.createdAt : undefined,
      payload:
        record.payload &&
        typeof record.payload === "object" &&
        !Array.isArray(record.payload)
          ? (record.payload as Record<string, unknown>)
          : undefined,
    });
  }
  return events;
};

export default async function AdminOrderDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect(`/${defaultLocale}/account?callbackUrl=/admin/orders`);
  }
  if (session.user.twoFAEnabled && !(session as any).twoFAVerified) {
    redirect("/admin/2fa/challenge");
  }

  // ✅ Unwrap params (Next 15)
  const { id: orderId } = await params;
  if (!orderId) notFound();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true } },
      items: {
        include: {
          product: { select: { name: true, slug: true, priceCents: true } },
        },
      },
    },
  });

  if (!order) notFound();

  const shippingAddress = parseAddress(order.shippingAddress);
  const billingAddress = parseAddress(order.billingAddress);
  const events = parseEvents(order.events);
  const providerMetadata =
    order.providerMetadata && typeof order.providerMetadata === "object"
      ? order.providerMetadata
      : null;

  const subtotalCents = order.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-sm text-neutral-600">
            Placed{" "}
            {order.createdAt.toLocaleString("en-GB", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="text-sm font-semibold text-neutral-900 underline-offset-4 hover:underline"
          >
            Back to orders
          </Link>
          <DeleteOrderButton
            orderId={order.id}
            orderLabel={`#${order.id.slice(0, 8).toUpperCase()}`}
          />
        </div>
      </header>

      <section className="grid gap-4 rounded-3xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm md:grid-cols-2">
        <div className="space-y-2 text-sm text-neutral-700">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Customer</p>
          <p className="font-semibold text-neutral-900">
            {order.user?.name ?? shippingAddress?.name ?? "Unknown"}
          </p>
          <p>{order.contactEmail ?? order.user?.email ?? "—"}</p>
          <p>{order.contactPhone ?? "—"}</p>
          <p>NIF/TIN: {order.taxId ?? "—"}</p>
          {order.isGuest ? (
            <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
              Guest order
            </span>
          ) : null}
        </div>
        <div className="space-y-2 text-sm text-neutral-700">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Payment</p>
          <p className="font-semibold text-neutral-900">{order.paymentStatus}</p>
          <p>
            Method: {order.paymentMethod ?? "—"} · Provider:{" "}
            {order.paymentProvider ?? "—"}
          </p>
          <p>Reference: {order.providerRef ?? "—"}</p>
          <p>
            Paid at:{" "}
            {order.paidAt
              ? order.paidAt.toLocaleString("en-GB", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : "—"}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Items</h2>
            <p className="text-sm text-neutral-600">
              Subtotal {formatCurrency("en", subtotalCents)} · Order total{" "}
              {formatCurrency("en", order.totalAmount)}
            </p>
          </div>
        </header>
        <ul className="divide-y divide-neutral-100">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div>
                <p className="font-semibold text-neutral-900">
                  {item.product?.name ?? "Product"}
                </p>
                <p className="text-xs text-neutral-500">
                  {item.quantity} × {formatCurrency("en", item.unitPrice)}
                </p>
              </div>
              <p className="text-sm font-semibold text-neutral-900">
                {formatCurrency("en", item.unitPrice * item.quantity)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 rounded-3xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm md:grid-cols-2">
        <AddressCard title="Shipping address" address={shippingAddress} />
        <AddressCard title="Billing address" address={billingAddress} />
      </section>

      <section className="grid gap-4 rounded-3xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-900">Provider metadata</h2>
          <pre className="overflow-x-auto rounded-xl bg-neutral-100 p-4 text-xs text-neutral-800">
            {providerMetadata ? JSON.stringify(providerMetadata, null, 2) : "—"}
          </pre>
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-900">Events</h2>
          {events.length === 0 ? (
            <p className="text-sm text-neutral-600">No events recorded.</p>
          ) : (
            <ul className="space-y-2 text-sm text-neutral-700">
              {events.map((event, index) => (
                <li
                  key={`${event.type}-${event.createdAt ?? index}`}
                  className="rounded-xl bg-neutral-50 p-3"
                >
                  <p className="font-semibold text-neutral-900">
                    {event.type ?? "Event"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {event.createdAt
                      ? new Date(event.createdAt).toLocaleString("en-GB", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "—"}
                  </p>
                  {event.payload ? (
                    <pre className="mt-2 overflow-x-auto rounded-lg bg-white p-3 text-[11px] text-neutral-700">
                      {JSON.stringify(event.payload, null, 2)}
                    </pre>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Update status</h2>
        <OrderStatusForm
          orderId={order.id}
          status={order.status}
          paymentStatus={order.paymentStatus}
          notes={order.notes}
        />
      </section>
    </div>
  );
}

function AddressCard({ title, address }: { title: string; address: Address | null }) {
  return (
    <div className="space-y-2 text-sm text-neutral-700">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{title}</p>
      {address ? (
        <div className="rounded-xl bg-neutral-50 p-4">
          {address.name ? (
            <p className="font-semibold text-neutral-900">{address.name}</p>
          ) : null}
          {address.line1 ? <p>{address.line1}</p> : null}
          {address.line2 ? <p>{address.line2}</p> : null}
          <p>{[address.postalCode, address.city].filter(Boolean).join(" ") || "—"}</p>
          <p>{address.country ?? "—"}</p>
        </div>
      ) : (
        <p className="rounded-xl bg-neutral-50 p-4 text-neutral-500">
          No address provided.
        </p>
      )}
    </div>
  );
}
