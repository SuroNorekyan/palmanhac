// lib/payments/eupago.ts
import { logPaymentEvent } from "@/lib/utils/payment-logger";
import { redactForLogging } from "@/lib/utils/redact";

const logEuPagoEvent = (
  level: Parameters<typeof logPaymentEvent>[0],
  event: string,
  details: Record<string, unknown> = {},
) => logPaymentEvent(level, event, redactForLogging(details) as Record<string, unknown>);

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
  currency: string; // e.g. "EUR"
  description?: string;
  customer: { email: string; name?: string; phone?: string };
  shipping?: EuPagoAddress;
  billing?: EuPagoAddress;
  locale?: string; // e.g. "en" | "pt"
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

const normalizeBaseUrl = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, "")
    .replace(/\/+$/, "")
    .replace(/\/api$/i, "");
const LIVE_BASE_CANDIDATES = ["https://clientes.eupago.pt", "https://eupago.pt"];
let liveWarningIssued = false;

const ensureBaseUrl = () => {
  const raw = process.env.EUPAGO_API_BASE;
  if (!raw) throw new EuPagoConfigurationError("EUPAGO_API_BASE is not defined.");
  const normalized = normalizeBaseUrl(raw);
  if (!liveWarningIssued && process.env.NODE_ENV !== "production") {
    if (LIVE_BASE_CANDIDATES.some((candidate) => normalized.startsWith(candidate))) {
      liveWarningIssued = true;
      console.warn(
        "[EuPago] Live API endpoint configured while NODE_ENV !== production. Handle with care.",
      );
    }
  }
  return normalized;
};
const ensureApiKey = () => {
  const key = process.env.EUPAGO_API_KEY;
  if (!key) throw new EuPagoConfigurationError("EUPAGO_API_KEY is not defined.");
  return key.trim();
};
const ensureCardReturnUrl = () => {
  const url = process.env.EUPAGO_CARD_RETURN_URL;
  if (!url) throw new EuPagoConfigurationError("EUPAGO_CARD_RETURN_URL is not defined.");
  return url.trim();
};

const buildUrl = (path: string) =>
  `${ensureBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

const parseJsonSafely = async <T>(res: Response): Promise<T> => {
  try {
    return (await res.json()) as T;
  } catch {
    throw new EuPagoAPIError("EuPago response was not valid JSON.");
  }
};

type Mode = "header" | "body";
type Format = "form" | "json";
type EuPagoSerializable =
  | string
  | number
  | boolean
  | null
  | undefined
  | EuPagoSerializable[]
  | { [key: string]: EuPagoSerializable };
type EuPagoPayload = Record<string, EuPagoSerializable>;
type EuPagoFetchOptions = {
  disableAuthInjection?: boolean;
};

const euPagoFetch = async <T>(
  path: string,
  payload: EuPagoPayload,
  mode: Mode,
  format: Format,
  options: EuPagoFetchOptions = {},
) => {
  const url = buildUrl(path);
  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": "palmanhac-payments-adapter",
  };
  const key = ensureApiKey();

  const toFormValue = (value: EuPagoSerializable) => {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return String(value);
    }
    return undefined;
  };

  const bodyParams = new URLSearchParams();
  for (const [k, v] of Object.entries(payload)) {
    const stringValue = toFormValue(v);
    if (stringValue !== undefined) bodyParams.set(k, stringValue);
  }

  const jsonPayload: Record<string, EuPagoSerializable> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v !== undefined && v !== null) jsonPayload[k] = v;
  }

  if (mode === "header" && !options.disableAuthInjection) {
    headers["ApiKey"] = key;
    headers["Authorization"] = `ApiKey ${key}`;
    headers["X-Api-Key"] = key;
  } else if (mode === "body" && !options.disableAuthInjection) {
    bodyParams.set("apiKey", key);
  }

  if (format === "form") {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  } else {
    headers["Content-Type"] = "application/json";
  }

  const redactPayload = (input: Record<string, EuPagoSerializable>) =>
    Object.fromEntries(
      Object.entries(input).map(([k, v]) =>
        k.toLowerCase().includes("key") ? [k, "<redacted>"] : [k, v],
      ),
    );

  const debugBody =
    format === "form"
      ? Object.fromEntries(
          [...bodyParams.entries()].map(([k, v]) => [
            k,
            k.toLowerCase().includes("key") ? "<redacted>" : v,
          ]),
        )
      : redactPayload(jsonPayload);

  const loggedHeaders: Record<string, string | undefined> = { ...headers };
  if (loggedHeaders.ApiKey) loggedHeaders.ApiKey = "<redacted>";
  if (loggedHeaders.Authorization) loggedHeaders.Authorization = "<redacted>";
  if (loggedHeaders["X-Api-Key"]) loggedHeaders["X-Api-Key"] = "<redacted>";

  await logEuPagoEvent("info", "eupago_request", {
    url,
    headers: loggedHeaders,
    body: debugBody,
    mode,
    format,
  });

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: format === "form" ? bodyParams.toString() : JSON.stringify(jsonPayload),
    cache: "no-store",
  });

  if (!res.ok) {
    const errorClone = res.clone();
    const errorPayload = (await errorClone.json().catch(async () => {
      const fallbackText = await res.text().catch(() => null);
      return fallbackText
        ? { message: fallbackText }
        : { message: "EuPago error response was empty." };
    })) ?? { message: "EuPago error response missing." };
    await logEuPagoEvent("error", "eupago_response_error", {
      url,
      status: res.status,
      response: errorPayload,
    });
    throw new EuPagoAPIError(
      `EuPago request failed with status ${res.status}.`,
      errorPayload,
    );
  }
  const parsed = await parseJsonSafely<T>(res);
  await logEuPagoEvent("info", "eupago_response_success", {
    url,
    status: res.status,
    response: parsed,
  });
  return parsed;
};

// ---------- Helpers
const asTwoDecimals = (n: number) => (Math.round(n * 100) / 100).toFixed(2);
const extractAmount = (raw: unknown) =>
  typeof raw === "number"
    ? raw
    : typeof raw === "string"
      ? Number.parseFloat(raw.replace(",", "."))
      : null;

const parsePaidAt = (payload: Record<string, unknown>) => {
  const c =
    (payload.paid_at as string | undefined) ??
    (payload.payment_date as string | undefined) ??
    (payload.processed_at as string | undefined) ??
    (payload.data_pagamento as string | undefined) ??
    (payload.dataPagamento as string | undefined);
  if (!c) return undefined;
  const t = Date.parse(c);
  return Number.isNaN(t) ? c : new Date(t).toISOString();
};

const normaliseStatusPayload = (p: Record<string, unknown>): EuPagoStatusResult => {
  const s = [
    p.status,
    p.state,
    p.payment_status,
    p.paymentStatus,
    p.result,
    p.response,
    p.estado,
  ]
    .map((v) => (typeof v === "string" ? v.toLowerCase() : undefined))
    .find((v) => v && v.trim());
  let status: EuPagoStatusResult["status"] = "unknown";
  if (
    s?.includes("paid") ||
    s === "ok" ||
    s === "paga" ||
    s === "pago" ||
    p.paid === true ||
    p.pago === 1
  )
    status = "paid";
  else if (
    s?.includes("fail") ||
    s?.includes("error") ||
    s?.includes("denied") ||
    s === "ko"
  )
    status = "failed";
  else if (s?.includes("cancel")) status = "cancelled";
  else if (s?.includes("expir")) status = "expired";
  else if (s?.includes("pend") || s?.includes("wait")) status = "pending";

  const error =
    (typeof p.error === "string" && p.error) ||
    (typeof p.message === "string" && p.message) ||
    (typeof p.reason === "string" && p.reason) ||
    undefined;

  return { status, paidAt: parsePaidAt(p), error, raw: p };
};

// ---------- Public API

export const createCard = async (order: EuPagoOrderInput): Promise<EuPagoCardResult> => {
  const eur = Math.max(order.amountCents, 100) / 100;
  const value = asTwoDecimals(eur);
  const payload: EuPagoPayload = {
    id: order.orderId,
    value,
    currency: (order.currency || "EUR").toUpperCase(),
    description: order.description ?? `Order ${order.orderId}`,
    return_url: ensureCardReturnUrl(),
    customer_email: order.customer.email,
    customer_name: order.customer.name ?? "",
    locale: order.locale ?? "en",
  };

  const res = await euPagoFetch<Record<string, unknown>>(
    "/api/v1.02/creditcard/create",
    payload,
    "header",
    "form",
  );

  const paymentUrl =
    (typeof res.paymentUrl === "string" && res.paymentUrl) ||
    (typeof res.payment_url === "string" && res.payment_url) ||
    (typeof res.redirect === "string" && res.redirect) ||
    null;
  const transactionId =
    (typeof res.transactionId === "string" && res.transactionId) ||
    (typeof res.transaction_id === "string" && res.transaction_id) ||
    (typeof res.id === "string" && res.id) ||
    null;

  if (!paymentUrl || !transactionId) {
    throw new EuPagoAPIError(
      "EuPago card response missing payment URL or transaction identifier.",
      res,
    );
  }
  return { method: "card", paymentUrl, transactionId, metadata: res };
};

export const createMBWay = async (
  order: EuPagoOrderInput & { phone: string; countryCode: string },
): Promise<EuPagoMBWayResult> => {
  const eur = Math.max(order.amountCents, 100) / 100;
  const value = Number.parseFloat(asTwoDecimals(eur));
  const payload: EuPagoPayload = {
    payment: {
      amount: {
        currency: (order.currency || "EUR").toUpperCase(),
        value,
      },
      identifier: order.orderId,
      customerPhone: order.phone,
      countryCode: order.countryCode,
    },
  };

  const res = await euPagoFetch<Record<string, unknown>>(
    "/api/v1.02/mbway/create",
    payload,
    "header",
    "json",
  );

  const transactionId =
    (typeof res.transactionId === "string" && res.transactionId) ||
    (typeof res.transaction_id === "string" && res.transaction_id) ||
    (typeof res.transactionID === "string" && res.transactionID) ||
    (typeof res.id === "string" && res.id) ||
    null;
  if (!transactionId)
    throw new EuPagoAPIError(
      "EuPago MB WAY response missing transaction identifier.",
      res,
    );

  const statusUrl =
    (typeof res.statusUrl === "string" && res.statusUrl) ||
    (typeof res.status_url === "string" && res.status_url) ||
    undefined;

  return { method: "mbway", transactionId, statusUrl, metadata: res };
};

export const createMultibanco = async (
  order: EuPagoOrderInput,
): Promise<EuPagoMultibancoResult> => {
  const amount = Number.parseFloat(asTwoDecimals(Math.max(order.amountCents, 100) / 100));
  const payload: EuPagoPayload = {
    key: ensureApiKey(),
    value: amount,
    id: order.orderId,
  };

  const res = await euPagoFetch<Record<string, unknown>>(
    "/clientes/rest_api/multibanco/create",
    payload,
    "body",
    "json",
    { disableAuthInjection: true },
  );

  const entity =
    (typeof res.entity === "string" && res.entity) ||
    (typeof res.entidade === "string" && res.entidade) ||
    null;
  const reference =
    (typeof res.reference === "string" && res.reference) ||
    (typeof res.referencia === "string" && res.referencia) ||
    null;
  const amt =
    extractAmount(res.amount) ??
    extractAmount(res.value) ??
    extractAmount(res.valor) ??
    Number(amount);

  const expiresAt =
    (typeof res.expires_at === "string" && res.expires_at) ||
    (typeof res.expiration === "string" && res.expiration) ||
    (typeof res.data_limite === "string" && res.data_limite) ||
    undefined;

  if (!entity || !reference) {
    throw new EuPagoAPIError(
      "EuPago Multibanco response is missing entity or reference.",
      res,
    );
  }
  return {
    method: "multibanco",
    entity,
    reference,
    amount: amt ?? Number(amount),
    expiresAt,
    metadata: res,
  };
};

// Optional status helpers (unchanged)
export const fetchMBWayStatus = async (
  statusUrl: string,
): Promise<EuPagoStatusResult> => {
  const url = /^https?:\/\//i.test(statusUrl) ? statusUrl : buildUrl(statusUrl);
  await logEuPagoEvent("info", "eupago_status_request", { method: "mbway", url });
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": "palmanhac-payments-adapter",
      ApiKey: ensureApiKey(),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const e = await res.json().catch(async () => ({ message: await res.text() }));
    await logEuPagoEvent("error", "eupago_status_error", {
      method: "mbway",
      url,
      status: res.status,
      response: e,
    });
    throw new EuPagoAPIError(
      `EuPago MB WAY status request failed with status ${res.status}.`,
      e,
    );
  }
  const parsed = await parseJsonSafely<Record<string, unknown>>(res);
  await logEuPagoEvent("info", "eupago_status_success", {
    method: "mbway",
    url,
    status: res.status,
    response: parsed,
  });
  return normaliseStatusPayload(parsed);
};

export const fetchMultibancoInfo = async (params: {
  reference?: string;
  entity?: string;
  transactionId?: string;
  orderId?: string;
  amount?: number;
}): Promise<EuPagoStatusResult> => {
  if (!params.reference && !params.transactionId && !params.orderId) {
    throw new EuPagoAPIError(
      "EuPago Multibanco info requires a reference, transactionId, or orderId.",
    );
  }
  const p: Record<string, string> = {};
  if (params.reference) p.referencia = params.reference;
  if (params.entity) p.entidade = params.entity;
  if (params.transactionId) p.transactionId = params.transactionId;
  if (params.orderId) p.id = params.orderId;
  if (typeof params.amount === "number" && Number.isFinite(params.amount)) {
    const a = asTwoDecimals(Math.max(params.amount, 1));
    p.valor = a;
  }
  const res = await euPagoFetch<Record<string, unknown>>(
    "/clientes/rest_api/multibanco/info",
    p,
    "body",
    "form",
  );
  return normaliseStatusPayload(res);
};

export const deriveProviderReference = (result: {
  method: "multibanco" | "mbway" | "card";
  reference?: string;
  transactionId?: string;
}) => {
  if (result.method === "multibanco" && result.reference)
    return normaliseProviderReference(result.reference);
  if ((result.method === "card" || result.method === "mbway") && result.transactionId)
    return normaliseProviderReference(result.transactionId);
  return null;
};

export const normaliseProviderReference = (value: string | null | undefined) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/[^0-9A-Za-z_-]/g, "").toUpperCase();
};
