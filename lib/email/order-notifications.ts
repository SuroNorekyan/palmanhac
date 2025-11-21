import { PaymentMethod } from "@prisma/client";
import {
  formatEmailBlock,
  formatEmailHtml,
  sendAdminEmail,
  sendEmail,
} from "./mailer.ts";

export type OrderEmailItem = {
  name: string;
  quantity: number;
  unitPriceCents: number;
};

export type MailingAddressFields = {
  name?: string | null;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

export type OrderEmailBaseOptions = {
  orderId: string;
  orderDate?: Date;
  totalCents: number;
  shippingCostCents?: number;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  shippingAddress: MailingAddressFields;
  taxId?: string | null;
  items: OrderEmailItem[];
};

type PaymentLabels = {
  pt: string;
  en: string;
};

const formatEuro = (cents: number) => `€${(cents / 100).toFixed(2)}`;

const buildOrderCode = (orderId: string) => `#${orderId.slice(0, 8).toUpperCase()}`;

const formatOrderItems = (items: OrderEmailItem[]) =>
  items.length
    ? items.map(
        (item) =>
          `- ${item.name} — ${item.quantity} × ${formatEuro(item.unitPriceCents)}`,
      )
    : ["- (sem artigos listados)"];

const joinAddress = (address: MailingAddressFields) => {
  const parts = [
    address.name,
    address.line1,
    address.line2,
    [address.postalCode, address.city].filter(Boolean).join(" ").trim(),
    address.country,
  ]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean);

  return parts.length ? parts.join(", ") : "—";
};

const formatDate = (value: Date, locale: "pt" | "en") =>
  new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-GB", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(value);

const applyBilingualLayout = (ptSection: string[], enSection: string[]) => [
  "Nota: pode encontrar a versão em inglês abaixo desta mensagem.",
  "",
  ...ptSection,
  "",
  "— English version below —",
  "",
  ...enSection,
];

const summarizeShippingCost = (
  items: OrderEmailItem[],
  totalCents: number,
  provided?: number,
) => {
  if (typeof provided === "number") {
    return provided;
  }

  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0,
  );
  const bottleCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const discountCents = bottleCount >= 10 ? Math.round(subtotal * 0.05) : 0;
  const inferred = totalCents - (subtotal - discountCents);
  return Math.max(inferred, 0);
};

const resolvePaymentLabels = (method?: PaymentMethod | null): PaymentLabels => {
  switch (method) {
    case PaymentMethod.MULTIBANCO:
      return { pt: "Multibanco", en: "Multibanco" };
    case PaymentMethod.MBWAY:
      return { pt: "MB WAY", en: "MB WAY" };
    default:
      return {
        pt: "Cartão (Visa / MasterCard)",
        en: "Card (Visa / MasterCard)",
      };
  }
};

const computeVatCents = (totalCents: number) =>
  Math.round(totalCents - totalCents / 1.23);

const sanitizeString = (value?: string | null, fallback = "—") =>
  value && value.trim().length ? value.trim() : fallback;

export const normalizeMailingAddress = (value: unknown): MailingAddressFields => {
  if (!value || typeof value !== "object") {
    return {};
  }

  const source = value as Record<string, unknown>;
  const read = (key: string) =>
    typeof source[key] === "string" ? (source[key] as string).trim() : undefined;

  return {
    name: read("name"),
    line1: read("line1"),
    line2: read("line2"),
    city: read("city"),
    postalCode: read("postalCode"),
    country: read("country"),
  };
};

const buildOrderSnapshot = (options: OrderEmailBaseOptions) => {
  const orderDate = options.orderDate ?? new Date();
  const orderCode = buildOrderCode(options.orderId);
  const shippingCostCents = summarizeShippingCost(
    options.items,
    options.totalCents,
    options.shippingCostCents,
  );
  const vatCents = computeVatCents(options.totalCents);
  const address = joinAddress(options.shippingAddress);
  const phone = sanitizeString(options.customerPhone);
  const customerName = sanitizeString(options.customerName, "Cliente Palmanhac");
  const itemsList = formatOrderItems(options.items);

  return {
    orderCode,
    orderDate,
    shippingCostCents,
    vatCents,
    address,
    phone,
    customerName,
    itemsList,
  };
};

export type OrderPlacedEmailOptions = OrderEmailBaseOptions;

export const sendOrderPlacedEmails = async (options: OrderPlacedEmailOptions) => {
  const snapshot = buildOrderSnapshot(options);
  const orderTotal = formatEuro(options.totalCents);
  const shippingCost = formatEuro(snapshot.shippingCostCents);
  const orderDatePt = formatDate(snapshot.orderDate, "pt");
  const orderDateEn = formatDate(snapshot.orderDate, "en");
  const address = snapshot.address;
  const phone = snapshot.phone;
  const vatText = formatEuro(snapshot.vatCents);

  const ptCustomerLines = [
    `Olá, ${snapshot.customerName}!`,
    "Obrigado pela sua compra na Palmanhac. Temos o prazer de confirmar que a sua encomenda foi recebida com sucesso.",
    "",
    "Aqui estão os detalhes da sua encomenda:",
    "",
    "🧾 DETALHES DA ENCOMENDA",
    `Número da encomenda: ${snapshot.orderCode}`,
    "",
    "🛒 Itens encomendados:",
    ...snapshot.itemsList,
    "(cada item no formato: produto — quantidade × preço)",
    "",
    `Custo de envio: ${shippingCost}`,
    `Valor total (IVA incluído): ${orderTotal}`,
    "",
    "📦 Informações de envio",
    `Nome: ${snapshot.customerName}`,
    `Endereço de entrega: ${address}`,
    `Telefone: ${phone}`,
    "",
    "🚚 O que acontece a seguir?",
    "Após a confirmação do pagamento, iremos enviar-lhe:",
    "",
    "a confirmação de envio,",
    "",
    "o número de rastreamento para acompanhar a sua entrega.",
    "",
    "Obrigado por escolher a Palmanhac.",
    "Se tiver alguma dúvida, estamos sempre disponíveis para ajudar.",
    "",
    "Email: info@palmanhac-shop.pt",
    "Telefone: +351 964 690 254",
    "",
    "Com os melhores cumprimentos,",
    "Equipa Palmanhac",
  ];

  const enCustomerLines = [
    `Hello, ${snapshot.customerName}!`,
    "Thank you for your purchase at Palmanhac. We are happy to confirm that your order has been successfully received.",
    "",
    "Here are the details of your order:",
    "",
    "🧾 ORDER DETAILS",
    `Order number: ${snapshot.orderCode}`,
    "",
    "🛒 Items ordered:",
    ...snapshot.itemsList,
    "(each item in the format: product — quantity × price)",
    "",
    `Shipping cost: ${shippingCost}`,
    `Total amount (IVA included): ${orderTotal}`,
    "",
    "📦 Shipping Information",
    `Name: ${snapshot.customerName}`,
    `Delivery address: ${address}`,
    `Phone number: ${phone}`,
    "",
    "🚚 What happens next?",
    "Once your payment is confirmed, we will send you:",
    "",
    "a shipping confirmation,",
    "",
    "a tracking number so you can follow your delivery.",
    "",
    "Thank you for choosing Palmanhac.",
    "If you have any questions, we are always here to help.",
    "",
    "Email: info@palmanhac-shop.pt",
    "Phone: +351 964 690 254",
    "",
    "Best regards,",
    "Palmanhac Team",
  ];

  const customerPayload = applyBilingualLayout(ptCustomerLines, enCustomerLines);

  if (options.customerEmail) {
    await sendEmail({
      to: options.customerEmail,
      subject: `A Sua Encomenda ${snapshot.orderCode} Foi Recebida – Palmanhac`,
      text: formatEmailBlock(customerPayload),
      html: formatEmailHtml(customerPayload),
    });
  }

  const adminLines = [
    "Olá,",
    "",
    "Foi registada uma nova encomenda na loja online.",
    "",
    "DETALHES DA ENCOMENDA",
    `Data da encomenda: ${orderDatePt}`,
    `Número da encomenda: ${snapshot.orderCode}`,
    `NIF do cliente: ${sanitizeString(options.taxId)}`,
    `Email do cliente: ${sanitizeString(options.customerEmail)}`,
    "",
    "🛒 Itens encomendados:",
    ...snapshot.itemsList,
    "(cada item no formato: produto — quantidade × preço)",
    "",
    `Custo de envio: ${shippingCost}`,
    `Valor total (IVA incluído): ${orderTotal}`,
    `IVA incluído: ${vatText}`,
    "",
    "📦 Informações de envio",
    `Nome: ${snapshot.customerName}`,
    `Endereço de entrega: ${address}`,
    `Telefone: ${phone}`,
    "",
    "Se precisar de atualizar ou verificar esta encomenda, pode fazê-lo no painel de administração.",
    "",
    "Cumprimentos,",
    "Sistema Palmanhac-Shop",
  ];

  await sendAdminEmail({
    subject: `Nova encomenda ${snapshot.orderCode}`,
    text: formatEmailBlock(adminLines),
    html: formatEmailHtml(adminLines),
  });
};

export type PaymentConfirmationEmailOptions = OrderEmailBaseOptions & {
  paymentDate?: Date;
  paymentMethod?: PaymentMethod | null;
};

export const sendPaymentConfirmationEmails = async (
  options: PaymentConfirmationEmailOptions,
) => {
  const snapshot = buildOrderSnapshot(options);
  const orderTotal = formatEuro(options.totalCents);
  const shippingCost = formatEuro(snapshot.shippingCostCents);
  const vatText = formatEuro(snapshot.vatCents);
  const paymentLabels = resolvePaymentLabels(options.paymentMethod);
  const paymentDatePt = formatDate(options.paymentDate ?? new Date(), "pt");
  const paymentDateEn = formatDate(options.paymentDate ?? new Date(), "en");
  const orderDatePt = formatDate(snapshot.orderDate, "pt");
  const orderDateEn = formatDate(snapshot.orderDate, "en");
  const address = snapshot.address;
  const phone = snapshot.phone;
  const itemsList = snapshot.itemsList;

  const ptCustomerLines = [
    "PAGAMENTO RECEBIDO – CONFIRMAÇÃO",
    `Assunto: Confirmação de Pagamento – Pedido ${snapshot.orderCode}`,
    "",
    `Olá ${snapshot.customerName},`,
    "",
    "Confirmamos que o pagamento do seu pedido foi recebido com sucesso.",
    "",
    "Detalhes do Pagamento",
    `Método de pagamento: ${paymentLabels.pt}`,
    `Valor recebido: ${orderTotal} (IVA incluído)`,
    `Data de pagamento: ${paymentDatePt}`,
    "",
    "Detalhes do Pedido",
    `Número do pedido: ${snapshot.orderCode}`,
    "",
    "Produtos encomendados:",
    ...itemsList,
    "",
    `Custos de envio: ${shippingCost}`,
    `Total: ${orderTotal} (IVA incluído)`,
    "",
    "Endereço de Entrega",
    `Nome: ${snapshot.customerName}`,
    `Endereço: ${address}`,
    `Telefone: ${phone}`,
    "",
    "O seu pedido será agora preparado. Assim que for enviado, receberá uma nova notificação com o número de rastreamento.",
    "",
    "Agradecemos a sua confiança na Palmanhac!",
    "",
    "Com os melhores cumprimentos,",
    "Equipa Palmanhac",
  ];

  const enCustomerLines = [
    "🇬🇧 PAYMENT RECEIVED – CONFIRMATION",
    `Subject: Payment Confirmation – Order ${snapshot.orderCode}`,
    "",
    `Hello ${snapshot.customerName},`,
    "",
    "We confirm that the payment for your order has been successfully received.",
    "",
    "Payment Details",
    `Payment method: ${paymentLabels.en}`,
    `Amount received: ${orderTotal} (VAT included)`,
    `Payment date: ${paymentDateEn}`,
    "",
    "Order Details",
    `Order number: ${snapshot.orderCode}`,
    "",
    "Ordered products:",
    ...itemsList,
    "",
    `Shipping cost: ${shippingCost}`,
    `Total: ${orderTotal} (VAT included)`,
    "",
    "Shipping Address",
    `Name: ${snapshot.customerName}`,
    `Address: ${address}`,
    `Phone: ${phone}`,
    "",
    "Your order will now be prepared. As soon as it is shipped, you will receive another notification with the tracking number.",
    "",
    "Thank you for choosing Palmanhac!",
    "",
    "Kind regards,",
    "Palmanhac Team",
  ];

  const customerPayload = applyBilingualLayout(ptCustomerLines, enCustomerLines);

  if (options.customerEmail) {
    await sendEmail({
      to: options.customerEmail,
      subject: `Confirmação de Pagamento – Pedido ${snapshot.orderCode}`,
      text: formatEmailBlock(customerPayload),
      html: formatEmailHtml(customerPayload),
    });
  }

  const paymentOptions = [
    { method: PaymentMethod.CARD, label: "Cartão (Visa / MasterCard)" },
    { method: PaymentMethod.MULTIBANCO, label: "Multibanco" },
    { method: PaymentMethod.MBWAY, label: "MB Way" },
  ];

  const paymentLines = paymentOptions.map(
    ({ method, label }) => `${options.paymentMethod === method ? "☑" : "☐"} ${label}`,
  );

  const adminLines = [
    "ASSUNTO: Pagamento Confirmado – Encomenda",
    `${snapshot.orderCode}`,
    "Pagamento Confirmado",
    `Data do pagamento: ${paymentDatePt}`,
    `Número da encomenda: ${snapshot.orderCode}`,
    "",
    "💳 Método de pagamento",
    "(assinalar a opção correspondente)",
    "",
    ...paymentLines,
    "",
    `🧾 Valor recebido: ${orderTotal}`,
    `IVA incluído (${vatText})`,
    "",
    "DETALHES DA ENCOMENDA",
    `Data da encomenda: ${orderDatePt}`,
    `Número da encomenda: ${snapshot.orderCode}`,
    `NIF do cliente: ${sanitizeString(options.taxId)}`,
    `Email do cliente: ${sanitizeString(options.customerEmail)}`,
    "",
    "🛒 Itens encomendados:",
    ...itemsList,
    "(cada item no formato: produto — quantidade × preço)",
    "",
    `Custo de envio: ${shippingCost}`,
    `Valor total (IVA incluído): ${orderTotal}`,
    `IVA incluído: ${vatText}`,
    "",
    "📦 Informações de envio",
    `Nome: ${snapshot.customerName}`,
    `Endereço de entrega: ${address}`,
    `Telefone: ${phone}`,
    "",
    "Se precisar de atualizar ou verificar esta encomenda, pode fazê-lo no painel de administração.",
    "",
    "Cumprimentos,",
    "Sistema Palmanhac-Shop",
  ];

  await sendAdminEmail({
    subject: `Pagamento confirmado ${snapshot.orderCode}`,
    text: formatEmailBlock(adminLines),
    html: formatEmailHtml(adminLines),
  });
};
