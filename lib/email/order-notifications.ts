import {
  formatEmailBlock,
  formatEmailHtml,
  sendAdminEmail,
  sendEmail,
} from "@/lib/email/mailer";

export type OrderEmailItem = {
  name: string;
  quantity: number;
};

export type BilingualInstructions = {
  pt?: string[];
  en?: string[];
};

export type OrderNotificationOptions = {
  orderId: string;
  totalCents: number;
  items: OrderEmailItem[];
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  shippingCity?: string | null;
  paymentSummary?: string;
  nif?: string | null;
  notes?: string | null;
  methodInstructions?: BilingualInstructions;
  adminSubject?: string;
  customerSubject?: string;
};

const formatEuro = (cents: number) => `€${(cents / 100).toFixed(2)}`;

const sanitize = (lines?: string[]) => (lines ?? []).filter(Boolean);

const formatItems = (items: OrderEmailItem[]) =>
  items.length
    ? items.map((item) => `- ${item.name} × ${item.quantity}`)
    : ["- (no items provided)"];

type BaseEmailOptions = {
  shortCode: string;
  totalCents: number;
  nif?: string | null;
  items: OrderEmailItem[];
  methodInstructions?: BilingualInstructions;
};

const buildOrderEmailLines = ({
  shortCode,
  totalCents,
  nif,
  items,
  methodInstructions,
}: BaseEmailOptions) => {
  const total = formatEuro(totalCents);
  const itemLines = formatItems(items);
  const separator = "----------------------------------------";

  const ptSection = [
    "PT",
    separator,
    "",
    "Olá!",
    "",
    "Obrigado pela sua encomenda na Palmanhac.",
    "",
    "Recebemos o seu pedido com sucesso. Seguem os detalhes:",
    "",
    `**Número da encomenda:** ${shortCode}`,
    ...(nif ? [`**NIF / TIN:** ${nif}`] : []),
    "",
    "**Itens encomendados:**",
    ...itemLines,
    "",
    `**Valor total (incluindo IVA):** ${total}`,
    "",
    "A sua encomenda será enviada após a confirmação do pagamento.",
    "Caso tenha alguma dúvida ou precise de assistência, estamos sempre disponíveis.",
    "",
    "Pode contactar-nos através de:",
    "• Email: info@palmanhac-shop.pt",
    "• Telefone: +351 964 690 254",
    "",
    ...sanitize(methodInstructions?.pt),
    "",
    "Obrigado por escolher a Palmanhac!",
    "",
    "Com os melhores cumprimentos,",
    "**Equipa Palmanhac**",
    "",
  ];

  const enSection = [
    "EN",
    separator,
    "",
    "Hello!",
    "",
    "Thank you for your order at Palmanhac.",
    "",
    "We have successfully received your order. Here are the details:",
    "",
    `**Order number:** ${shortCode}`,
    ...(nif ? [`**Tax ID (NIF/TIN):** ${nif}`] : []),
    "",
    "**Ordered items:**",
    ...itemLines,
    "",
    `**Total amount (including VAT):** ${total}`,
    "",
    "Your order will be shipped once the payment is confirmed.",
    "If you have any questions or need assistance, we are always here to help.",
    "",
    "You can contact us at:",
    "• Email: info@palmanhac-shop.pt",
    "• Phone: +351 964 690 254",
    "",
    ...sanitize(methodInstructions?.en),
    "",
    "Thank you for choosing Palmanhac!",
    "",
    "Best regards,",
    "**Palmanhac Team**",
    "",
  ];

  return [...ptSection, "", ...enSection];
};

export const sendOrderCreationNotifications = async ({
  orderId,
  totalCents,
  items,
  customerName,
  customerEmail,
  customerPhone,
  shippingCity,
  paymentSummary,
  nif,
  notes,
  methodInstructions,
  adminSubject,
  customerSubject,
}: OrderNotificationOptions) => {
  const shortCode = `#${orderId.slice(0, 8).toUpperCase()}`;
  const baseLines = buildOrderEmailLines({
    shortCode,
    totalCents,
    nif,
    items,
    methodInstructions,
  });

  const adminLines = [
    "Admin details:",
    `Full order ID: ${orderId}`,
    `Short reference: ${shortCode}`,
    `Customer: ${customerName}`,
    customerEmail ? `Email: ${customerEmail}` : "",
    customerPhone ? `Phone: ${customerPhone}` : "",
    shippingCity ? `City: ${shippingCity}` : "",
    paymentSummary ? `Payment: ${paymentSummary}` : "",
    notes ? `Notes: ${notes}` : "",
  ];

  await sendAdminEmail({
    subject: adminSubject ?? `New order ${shortCode}`,
    text: formatEmailBlock([...baseLines, "", ...sanitize(adminLines)]),
    html: formatEmailHtml([...baseLines, "", ...sanitize(adminLines)]),
  });

  if (customerEmail) {
    await sendEmail({
      to: customerEmail,
      subject: customerSubject ?? `We received your order ${shortCode}`,
      text: formatEmailBlock(baseLines),
      html: formatEmailHtml(baseLines),
    });
  }
};
