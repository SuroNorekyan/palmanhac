// scripts/send-test-email.ts
import "dotenv/config";
import { PaymentMethod } from "@prisma/client";
import {
  sendOrderPlacedEmails,
  sendPaymentConfirmationEmails,
  type OrderEmailBaseOptions,
} from "../lib/email/order-notifications.ts";

const recipient = "suren.norekyan123@gmail.com";

async function main() {
  process.env.ADMIN_EMAIL = recipient;

  const baseOrder: OrderEmailBaseOptions = {
    orderId: `test-${Date.now()}`,
    orderDate: new Date(),
    totalCents: 7250,
    shippingCostCents: 800,
    items: [
      { name: "Licor de Café", quantity: 1, unitPriceCents: 1850 },
      { name: "Aguardente XO", quantity: 2, unitPriceCents: 2700 },
    ],
    customerName: "Palmanhac Admin",
    customerEmail: recipient,
    customerPhone: "+351 964 690 254",
    shippingAddress: {
      name: "Palmanhac Admin",
      line1: "Rua do Progresso 10",
      line2: "Apartamento 3B",
      city: "Palmela",
      postalCode: "2950-000",
      country: "Portugal",
    },
    taxId: "123456789",
  };

  await sendOrderPlacedEmails(baseOrder);
  await sendPaymentConfirmationEmails({
    ...baseOrder,
    paymentDate: new Date(),
    paymentMethod: PaymentMethod.CARD,
  });

  console.log(`Dispatched sample order and payment confirmation emails to ${recipient}`);
}

main().catch((error) => {
  console.error("Failed to send test email:", error);
  process.exitCode = 1;
});
