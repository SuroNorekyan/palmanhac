"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils/currency";

type AdminOrder = {
  id: string;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "COMPLETED" | "CANCELLED";
  paymentStatus: "UNPAID" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  totalAmount: number;
  createdAt: string;
  user: {
    id: string;
    email: string | null;
    name: string | null;
  } | null;
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    product: {
      id: number;
      name: string;
      slug: string;
    } | null;
  }[];
};

const orderStatusOptions: Array<AdminOrder["status"]> = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
];

const paymentStatusOptions: Array<AdminOrder["paymentStatus"]> = [
  "UNPAID",
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
];

const bilingualLabel = (en: string, pt: string) => `${en} / ${pt}`;

const orderStatusLabels: Record<AdminOrder["status"], string> = {
  PENDING: bilingualLabel("Pending", "Pendente"),
  PROCESSING: bilingualLabel("Processing", "Em processamento"),
  SHIPPED: bilingualLabel("Shipped", "Enviada"),
  COMPLETED: bilingualLabel("Completed", "Concluída"),
  CANCELLED: bilingualLabel("Cancelled", "Cancelada"),
};

const paymentStatusLabels: Record<AdminOrder["paymentStatus"], string> = {
  UNPAID: bilingualLabel("Unpaid", "Por pagar"),
  PENDING: bilingualLabel("Pending", "Pendente"),
  PAID: bilingualLabel("Paid", "Pago"),
  FAILED: bilingualLabel("Failed", "Falhou"),
  REFUNDED: bilingualLabel("Refunded", "Reembolsado"),
};

const localeFormatMap = {
  en: "en-GB",
  pt: "pt-PT",
} as const;

const formatDate = (value: string) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat(localeFormatMap.en, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export function AdminOrdersManager() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, startTransition] = useTransition();

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/orders", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load orders");
      }
      const payload = (await response.json()) as { orders: AdminOrder[] };
      setOrders(payload.orders);
    } catch (error) {
      console.error(error);
      toast({
        title: "Failed to load orders / Falha ao carregar encomendas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  const updateOrder = (
    id: string,
    updates: Partial<Pick<AdminOrder, "status" | "paymentStatus">>,
  ) => {
    startTransition(async () => {
      const response = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        toast({
          title: payload?.error ?? "Failed to update / Falha na atualização",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Order updated / Encomenda atualizada",
        variant: "success",
      });
      void loadOrders();
    });
  };

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold text-neutral-900">Orders / Encomendas</h2>
        <p className="text-sm text-neutral-600">
          Monitor payments and fulfilment / Monitorizar pagamentos e expedição
        </p>
      </header>
      <div className="space-y-4 rounded-3xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm">
        {isLoading ? (
          <p className="text-sm text-neutral-600">Loading… / A carregar…</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-neutral-600">
            No orders registered / Ainda sem encomendas
          </p>
        ) : (
          <ul className="space-y-4">
            {orders.map((order) => (
              <li
                key={order.id}
                className="space-y-3 rounded-2xl border border-neutral-100 bg-neutral-50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-600">
                  <span className="font-semibold text-neutral-900">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                <div className="grid gap-3 text-sm text-neutral-700 md:grid-cols-4">
                  <div>
                    <p className="text-neutral-500">Customer / Cliente</p>
                    <p className="font-medium text-neutral-900">
                      {order.user?.name ?? order.user?.email ?? "Unknown / Desconhecido"}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Total</p>
                    <p className="font-semibold text-neutral-900">
                      {formatCurrency("en", order.totalAmount)}
                    </p>
                  </div>
                  <div>
                    <label className="text-neutral-500">Status</label>
                    <select
                      className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
                      value={order.status}
                      onChange={(event) =>
                        updateOrder(order.id, {
                          status: event.target.value as AdminOrder["status"],
                        })
                      }
                      disabled={isUpdating}
                    >
                      {orderStatusOptions.map((option) => (
                        <option key={option} value={option}>
                          {orderStatusLabels[option]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-neutral-500">Payment</label>
                    <select
                      className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
                      value={order.paymentStatus}
                      onChange={(event) =>
                        updateOrder(order.id, {
                          paymentStatus: event.target
                            .value as AdminOrder["paymentStatus"],
                        })
                      }
                      disabled={isUpdating}
                    >
                      {paymentStatusOptions.map((option) => (
                        <option key={option} value={option}>
                          {paymentStatusLabels[option]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2 rounded-xl bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Items / Artigos
                  </p>
                  {order.items.length === 0 ? (
                    <p className="text-sm text-neutral-500">
                      No items recorded / Sem artigos associados
                    </p>
                  ) : (
                    <ul className="space-y-2 text-sm text-neutral-700">
                      {order.items.map((item) => (
                        <li key={item.id} className="flex justify-between gap-3">
                          <span>
                            {item.product?.name ?? "Product"} × {item.quantity}
                          </span>
                          <span className="font-medium text-neutral-900">
                            {formatCurrency("en", item.unitPrice * item.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex justify-end">
        <Button variant="ghost" onClick={() => void loadOrders()} disabled={isLoading}>
          Refresh / Atualizar
        </Button>
      </div>
    </section>
  );
}
