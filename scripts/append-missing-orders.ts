import {
  OrderStatus,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
  PrismaClient,
} from "@prisma/client";
import { getEffectivePriceCents } from "@/lib/utils/pricing";

if (typeof process.loadEnvFile === "function") {
  process.loadEnvFile();
}

const prisma = new PrismaClient();

type RestoredOrderConfig = {
  id: string;
  displayCode: string;
  createdAt: string;
  paidAt?: string;
  paymentMethod: PaymentMethod;
  totalCents: number;
  providerRef: string;
  contactEmail: string;
  contactPhone?: string;
  taxId?: string;
  shippingAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    postalCode: string;
    country: string;
  };
  locale?: string;
  notes?: string;
  items: Array<{
    productName: string;
    productSlug?: string;
    quantity: number;
    unitPriceCents?: number;
  }>;
};

const ORDERS_TO_APPEND: RestoredOrderConfig[] = [
  {
    id: "0ddb3009-restored-mbway",
    displayCode: "0DDB3009",
    createdAt: "2025-11-23T20:33:00.000Z",
    paidAt: "2025-11-23T20:33:00.000Z",
    paymentMethod: PaymentMethod.MBWAY,
    totalCents: 1603,
    providerRef: "MBWAY-0DDB3009",
    contactEmail: "mariakazumyan@gmail.com",
    contactPhone: "911121789",
    taxId: "282845232",
    shippingAddress: {
      name: "Maria Kazumyan",
      line1: "Rua dom Jorge Lote 68",
      city: "Palmela",
      postalCode: "2950-423",
      country: "PT",
    },
    locale: "pt",
    notes:
      "Recovered from txt/orders-to-append.txt (includes €6.00 shipping, recorded as part of total).",
    items: [
      {
        productName: "Palmanhac Strawberry Liqueur",
        productSlug: "palmanhac-licor-morango",
        quantity: 1,
        unitPriceCents: 1003,
      },
    ],
  },
];

const buildRestoredEvents = (reason: string, method: PaymentMethod) => {
  const now = new Date();
  return [
    {
      type: "restored_order",
      createdAt: now.toISOString(),
      payload: {
        reason,
      },
    },
    {
      type: "payment_confirmed",
      createdAt: now.toISOString(),
      payload: {
        provider: PaymentProvider.EUPAGO,
        method,
        status: "restored",
      },
    },
  ];
};

async function restoreOrders() {
  for (const entry of ORDERS_TO_APPEND) {
    const existing = await prisma.order.findUnique({ where: { id: entry.id } });
    if (existing) {
      console.info(`ℹ️  Order ${entry.displayCode} already exists. Skipping.`);
      continue;
    }

    const normalizedItems: Array<{
      productId: number;
      quantity: number;
      unitPrice: number;
    }> = [];
    for (const item of entry.items) {
      let product = null;
      if (item.productSlug) {
        product = await prisma.product.findUnique({
          where: { slug: item.productSlug },
          select: {
            id: true,
            priceCents: true,
            discountEnabled: true,
            discountPercent: true,
          },
        });
      }
      if (!product) {
        product = await prisma.product.findFirst({
          where: { name: { equals: item.productName, mode: "insensitive" } },
          select: {
            id: true,
            priceCents: true,
            discountEnabled: true,
            discountPercent: true,
          },
        });
      }
      if (!product) {
        throw new Error(
          `Unable to restore order ${entry.displayCode}: product "${item.productName}" not found.`,
        );
      }
      normalizedItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: item.unitPriceCents ?? getEffectivePriceCents(product),
      });
    }

    await prisma.order.create({
      data: {
        id: entry.id,
        userId: null,
        isGuest: true,
        status: OrderStatus.PROCESSING,
        paymentStatus: PaymentStatus.PAID,
        totalAmount: entry.totalCents,
        paymentMethod: entry.paymentMethod,
        paymentProvider: PaymentProvider.EUPAGO,
        providerRef: entry.providerRef,
        providerMetadata: {
          restoredFrom: "txt/orders-to-append.txt",
        },
        notes: entry.notes,
        currency: "EUR",
        contactEmail: entry.contactEmail,
        contactPhone: entry.contactPhone,
        taxId: entry.taxId,
        shippingAddress: entry.shippingAddress,
        billingAddress: entry.shippingAddress,
        locale: entry.locale ?? "pt",
        createdAt: new Date(entry.createdAt),
        paidAt: entry.paidAt ? new Date(entry.paidAt) : new Date(entry.createdAt),
        events: buildRestoredEvents(entry.displayCode, entry.paymentMethod),
        items: {
          create: normalizedItems,
        },
      },
    });

    console.info(`✅ Restored order ${entry.displayCode}`);
  }
}

restoreOrders()
  .catch((error) => {
    console.error("❌ Failed to restore orders:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
