export class EuPagoConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EuPagoConfigurationError";
  }
}

export class EuPagoAPIError extends Error {
  response?: unknown;

  constructor(message: string, response?: unknown) {
    super(message);
    this.name = "EuPagoAPIError";
    this.response = response;
  }
}

export type EuPagoAddress = {
  name?: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country: string;
};

export type EuPagoOrderInput = {
  orderId: string;
  amountCents: number;
  currency: string;
  description?: string;
  customer: {
    email: string;
    name?: string;
    phone?: string;
  };
  shipping?: EuPagoAddress;
  billing?: EuPagoAddress;
  locale?: string;
  metadata?: Record<string, unknown>;
};

export type EuPagoMultibancoResult = {
  method: "multibanco";
  entity: string;
  reference: string;
  amount: number;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
};

export type EuPagoMBWayResult = {
  method: "mbway";
  transactionId: string;
  statusUrl?: string;
  metadata?: Record<string, unknown>;
};

export type EuPagoCardResult = {
  method: "card";
  paymentUrl: string;
  transactionId: string;
  metadata?: Record<string, unknown>;
};

export type EuPagoStatusResult = {
  status: "pending" | "paid" | "failed" | "expired" | "cancelled" | string;
  paidAt?: string;
  error?: string;
  raw?: Record<string, unknown>;
};

type EuPagoRequestOptions = {
  method?: "GET" | "POST";
  headers?: Record<string, string>;
};

const normalizeBaseUrl = (value: string) => value.replace(/\s+/g, "").replace(/\/+$/, "");

const ensureBaseUrl = () => {
  const raw = process.env.EUPAGO_API_BASE;
  if (!raw) {
    throw new EuPagoConfigurationError("EUPAGO_API_BASE is not defined.");
  }
  return normalizeBaseUrl(raw);
};

const ensureApiKey = () => {
  const apiKey = process.env.EUPAGO_API_KEY;
  if (!apiKey) {
    throw new EuPagoConfigurationError("EUPAGO_API_KEY is not defined.");
  }
  return apiKey;
};

const buildUrl = (path: string) => {
  const base = ensureBaseUrl();
  if (!path.startsWith("/")) {
    return `${base}/${path}`;
  }
  return `${base}${path}`;
};

const defaultHeaders = () => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  "User-Agent": "palmanhac-payments-adapter",
});

const parseJsonSafely = async <T>(response: Response): Promise<T> => {
  try {
    return (await response.json()) as T;
  } catch {
    throw new EuPagoAPIError("EuPago response was not valid JSON.");
  }
};

const euPagoFetch = async <T>(
  path: string,
  payload: Record<string, unknown>,
  options: EuPagoRequestOptions = {},
) => {
  const apiKey = ensureApiKey();
  const url = buildUrl(path);
  const method = options.method ?? "POST";

  const requestInit: RequestInit = {
    method,
    headers: {
      ...defaultHeaders(),
      Authorization: `Bearer ${apiKey}`,
      ...options.headers,
    },
  };

  if (method === "GET") {
    const merged = new URL(url);
    Object.entries({ ...payload, apiKey }).forEach(([key, value]) => {
      if (typeof value === "string") {
        merged.searchParams.set(key, value);
      }
    });
    const response = await fetch(merged, {
      method,
      headers: requestInit.headers,
      cache: "no-store",
    });
    if (!response.ok) {
      const errorPayload = await response
        .json()
        .catch(async () => ({ message: await response.text() }));
      throw new EuPagoAPIError(
        `EuPago request failed with status ${response.status}.`,
        errorPayload,
      );
    }
    return (await parseJsonSafely<T>(response)) as T;
  }

  requestInit.body = JSON.stringify({
    ...payload,
    apiKey,
  });
  const response = await fetch(url, { ...requestInit, cache: "no-store" });
  if (!response.ok) {
    const errorPayload = await response
      .json()
      .catch(async () => ({ message: await response.text() }));
    throw new EuPagoAPIError(
      `EuPago request failed with status ${response.status}.`,
      errorPayload,
    );
  }
  return (await parseJsonSafely<T>(response)) as T;
};

const normaliseReference = (value: string | number | null | undefined) => {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }
  return String(value).replace(/[^0-9]/g, "");
};

const extractAmount = (raw: unknown) => {
  if (typeof raw === "number") {
    return raw;
  }
  if (typeof raw === "string") {
    const parsed = Number.parseFloat(raw.replace(",", "."));
    if (!Number.isFinite(parsed)) {
      return null;
    }
    return parsed;
  }
  return null;
};

export const createMultibanco = async (
  order: EuPagoOrderInput,
): Promise<EuPagoMultibancoResult> => {
  const payload = {
    id: order.orderId,
    value: (order.amountCents / 100).toFixed(2),
    currency: order.currency?.toUpperCase() ?? "EUR",
    description: order.description ?? `Order ${order.orderId}`,
    customer_email: order.customer.email,
    customer_name: order.customer.name,
    customer_phone: order.customer.phone,
    shipping_address: order.shipping,
    billing_address: order.billing,
    locale: order.locale,
    metadata: order.metadata,
  };

  const response = await euPagoFetch<Record<string, unknown>>(
    "/api/v1/multibanco/create",
    payload,
  );

  const entity =
    typeof response.entity === "string"
      ? response.entity
      : typeof response.entidade === "string"
        ? response.entidade
        : null;
  const reference =
    typeof response.reference === "string"
      ? response.reference
      : typeof response.referencia === "string"
        ? response.referencia
        : null;
  const amount =
    extractAmount(response.amount) ??
    extractAmount(response.value) ??
    extractAmount(response.valor) ??
    order.amountCents / 100;
  const expiresAt =
    typeof response.expires_at === "string"
      ? response.expires_at
      : typeof response.expiration === "string"
        ? response.expiration
        : typeof response.data_limite === "string"
          ? response.data_limite
          : undefined;

  if (!entity || !reference) {
    throw new EuPagoAPIError(
      "EuPago Multibanco response is missing entity or reference.",
      response,
    );
  }

  return {
    method: "multibanco",
    entity,
    reference,
    amount,
    expiresAt,
    metadata: response,
  };
};

export const createMBWay = async (
  order: EuPagoOrderInput & { phone: string },
): Promise<EuPagoMBWayResult> => {
  const payload = {
    id: order.orderId,
    value: (order.amountCents / 100).toFixed(2),
    currency: order.currency?.toUpperCase() ?? "EUR",
    description: order.description ?? `Order ${order.orderId}`,
    customer_email: order.customer.email,
    customer_name: order.customer.name,
    customer_phone: order.phone,
    locale: order.locale,
    metadata: order.metadata,
  };

  const response = await euPagoFetch<Record<string, unknown>>(
    "/api/v1/mbway/create",
    payload,
  );

  const transactionId =
    typeof response.transactionId === "string"
      ? response.transactionId
      : typeof response.transaction_id === "string"
        ? response.transaction_id
        : typeof response.id === "string"
          ? response.id
          : null;

  if (!transactionId) {
    throw new EuPagoAPIError(
      "EuPago MB WAY response missing transaction identifier.",
      response,
    );
  }

  const statusUrl =
    typeof response.statusUrl === "string"
      ? response.statusUrl
      : typeof response.status_url === "string"
        ? response.status_url
        : undefined;

  return {
    method: "mbway",
    transactionId,
    statusUrl,
    metadata: response,
  };
};

export const createCard = async (order: EuPagoOrderInput): Promise<EuPagoCardResult> => {
  const payload = {
    id: order.orderId,
    value: (order.amountCents / 100).toFixed(2),
    currency: order.currency?.toUpperCase() ?? "EUR",
    description: order.description ?? `Order ${order.orderId}`,
    return_url: process.env.EUPAGO_CARD_RETURN_URL,
    customer_email: order.customer.email,
    customer_name: order.customer.name,
    customer_phone: order.customer.phone,
    locale: order.locale,
    metadata: order.metadata,
  };

  const response = await euPagoFetch<Record<string, unknown>>(
    "/api/v1/cards/create",
    payload,
  );

  const paymentUrl =
    typeof response.paymentUrl === "string"
      ? response.paymentUrl
      : typeof response.payment_url === "string"
        ? response.payment_url
        : typeof response.redirect === "string"
          ? response.redirect
          : null;
  const transactionId =
    typeof response.transactionId === "string"
      ? response.transactionId
      : typeof response.transaction_id === "string"
        ? response.transaction_id
        : typeof response.id === "string"
          ? response.id
          : null;

  if (!paymentUrl || !transactionId) {
    throw new EuPagoAPIError(
      "EuPago card response missing payment URL or transaction identifier.",
      response,
    );
  }

  return {
    method: "card",
    paymentUrl,
    transactionId,
    metadata: response,
  };
};

export const getStatus = async (transactionId: string): Promise<EuPagoStatusResult> => {
  const response = await euPagoFetch<Record<string, unknown>>(
    "/api/v1/transactions/status",
    {
      transactionId,
    },
    { method: "GET" },
  );

  const status =
    typeof response.status === "string"
      ? response.status
      : typeof response.state === "string"
        ? response.state
        : "unknown";
  const paidAt =
    typeof response.paid_at === "string"
      ? response.paid_at
      : typeof response.payment_date === "string"
        ? response.payment_date
        : undefined;
  const error =
    typeof response.error === "string"
      ? response.error
      : typeof response.message === "string"
        ? response.message
        : undefined;

  return {
    status,
    paidAt,
    error,
    raw: response,
  };
};

export const deriveProviderReference = (result: {
  method: "multibanco" | "mbway" | "card";
  reference?: string;
  transactionId?: string;
}) => {
  if (result.method === "multibanco" && result.reference) {
    return normaliseReference(result.reference);
  }
  if ((result.method === "card" || result.method === "mbway") && result.transactionId) {
    return String(result.transactionId);
  }
  return null;
};

export const normaliseProviderReference = (value: string | null | undefined) =>
  normaliseReference(value);
