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
  reference?: string | null;
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
const resolveMultibancoPerDup = () => {
  const raw = process.env.EUPAGO_MULTIBANCO_PER_DUP;
  if (!raw) return 0;
  if (raw === "1") return 1;
  if (raw === "0") return 0;
  const normalized = raw.trim().toLowerCase();
  if (normalized === "true" || normalized === "yes") return 1;
  if (normalized === "false" || normalized === "no") return 0;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) return 0;
  return parsed === 1 ? 1 : 0;
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
  authStrategy?: EuPagoAuthStrategy;
};

type EuPagoAuthStrategy =
  | { type: "apiKey" }
  | { type: "bearer"; token: string }
  | { type: "none" };

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

  headers["ApiKey"] = key;
  headers["X-Api-Key"] = key;

  const authStrategy = options.authStrategy ?? { type: "apiKey" };
  if (authStrategy.type === "apiKey") {
    headers["Authorization"] = `ApiKey ${key}`;
  } else if (authStrategy.type === "bearer") {
    headers["Authorization"] = `Bearer ${authStrategy.token}`;
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
  const paidKeywords = [
    "paid",
    "pay",
    "ok",
    "success",
    "sucesso",
    "paga",
    "pago",
    "liquidado",
    "completed",
    "complete",
  ];
  const pendingKeywords = ["pend", "wait", "aguard", "process", "analise"];
  const failureKeywords = ["fail", "error", "denied", "ko", "reject", "recus"];

  const booleanPaid =
    p.paid === true ||
    p.paid === "true" ||
    p.success === true ||
    p.success === "true" ||
    p.confirmed === true ||
    p.confirmado === true ||
    p.ok === true ||
    p.pago === 1 ||
    p.pago === true ||
    p.liquidado === true;

  const statusCodePaid =
    (typeof p.status_code === "number" && p.status_code === 0) ||
    (typeof p.code === "number" && p.code === 0);

  if (
    booleanPaid ||
    (s && paidKeywords.some((keyword) => s.includes(keyword))) ||
    statusCodePaid
  )
    status = "paid";
  else if (s && failureKeywords.some((keyword) => s.includes(keyword))) status = "failed";
  else if (s?.includes("cancel")) status = "cancelled";
  else if (s?.includes("expir")) status = "expired";
  else if (s && pendingKeywords.some((keyword) => s.includes(keyword)))
    status = "pending";

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

  const reference =
    (typeof res.reference === "string" && res.reference) ||
    (typeof res.referencia === "string" && res.referencia) ||
    null;

  return { method: "mbway", transactionId, statusUrl, reference, metadata: res };
};

export const createMultibanco = async (
  order: EuPagoOrderInput,
): Promise<EuPagoMultibancoResult> => {
  const amountValue = Math.max(order.amountCents, 100) / 100;
  const amount = asTwoDecimals(amountValue);
  const payload: EuPagoPayload = {
    chave: ensureApiKey(),
    valor: amount,
    id: order.orderId,
    per_dup: resolveMultibancoPerDup(),
  };
  if (order.customer.email) payload.email = order.customer.email;
  if (order.customer.phone) payload.contacto = order.customer.phone;

  const res = await euPagoFetch<Record<string, unknown>>(
    "/clientes/rest_api/multibanco/create",
    payload,
    "body",
    "json",
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
  reference?: string | null;
  transactionId?: string | null;
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

const normaliseDigits = (value: string | null | undefined) => {
  if (!value) return null;
  const digits = value.replace(/[^0-9]/g, "");
  return digits || null;
};

type EuPagoBearerTokenResponse = {
  transactionStatus?: string;
  access_token?: string;
  token_type?: string;
  expires_in?: string | number;
  expiresIn?: string | number;
  expiration?: string | number;
  [key: string]: EuPagoSerializable;
};

const ensureOAuthClientId = () => {
  const value = process.env.EUPAGO_OAUTH_CLIENT_ID;
  if (!value)
    throw new EuPagoConfigurationError("EUPAGO_OAUTH_CLIENT_ID is not defined.");
  return value.trim();
};
const ensureOAuthClientSecret = () => {
  const value = process.env.EUPAGO_OAUTH_CLIENT_SECRET;
  if (!value)
    throw new EuPagoConfigurationError("EUPAGO_OAUTH_CLIENT_SECRET is not defined.");
  return value.trim();
};
const getOAuthGrantType = () =>
  (process.env.EUPAGO_OAUTH_GRANT_TYPE ?? "client_credentials").trim().toLowerCase();
const ensureOAuthUsername = () => {
  const value = process.env.EUPAGO_OAUTH_USERNAME;
  if (!value) throw new EuPagoConfigurationError("EUPAGO_OAUTH_USERNAME is not defined.");
  return value.trim();
};
const ensureOAuthPassword = () => {
  const value = process.env.EUPAGO_OAUTH_PASSWORD;
  if (!value) throw new EuPagoConfigurationError("EUPAGO_OAUTH_PASSWORD is not defined.");
  return value.trim();
};
const ensureOAuthRefreshToken = () => {
  const value = process.env.EUPAGO_OAUTH_REFRESH_TOKEN;
  if (!value)
    throw new EuPagoConfigurationError("EUPAGO_OAUTH_REFRESH_TOKEN is not defined.");
  return value.trim();
};

type BearerTokenCache = {
  token: string;
  expiresAt: number;
};
let bearerTokenCache: BearerTokenCache | null = null;
let bearerTokenPromise: Promise<BearerTokenCache> | null = null;

const logTokenRequest = async (
  level: Parameters<typeof logEuPagoEvent>[0],
  event: string,
  details: Record<string, unknown>,
) => logEuPagoEvent(level, event, details);

const requestBearerToken = async (): Promise<BearerTokenCache> => {
  const grantType = getOAuthGrantType();
  const body: Record<string, EuPagoSerializable> = {
    client_id: ensureOAuthClientId(),
    client_secret: ensureOAuthClientSecret(),
    grant_type: grantType,
  };
  if (grantType === "password") {
    body.username = ensureOAuthUsername();
    body.password = ensureOAuthPassword();
  } else if (grantType === "refresh_token") {
    body.refresh_token = ensureOAuthRefreshToken();
  }
  await logTokenRequest("info", "eupago_oauth_token_request", {
    grantType,
    hasUsername: Boolean(body.username),
  });
  const res = await fetch(buildUrl("/api/auth/token"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "palmanhac-payments-adapter",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const parsed = await parseJsonSafely<EuPagoBearerTokenResponse>(res);
  if (!res.ok) {
    await logTokenRequest("error", "eupago_oauth_token_error", {
      status: res.status,
      response: parsed,
    });
    throw new EuPagoAPIError(
      `EuPago bearer token request failed with status ${res.status}.`,
      parsed,
    );
  }
  const token =
    (typeof parsed.access_token === "string" && parsed.access_token.trim()) || null;
  if (!token) {
    await logTokenRequest("error", "eupago_oauth_token_missing", { response: parsed });
    throw new EuPagoAPIError(
      "EuPago bearer token response missing access token.",
      parsed,
    );
  }
  const expirySource =
    parsed.expires_in ?? parsed.expiresIn ?? parsed.expiration ?? parsed.expiresIn;
  let expiresAt = Date.now() + 10 * 60 * 1000;
  if (typeof expirySource === "number" && Number.isFinite(expirySource)) {
    expiresAt = Date.now() + Math.max(expirySource - 60, 30) * 1000;
  } else if (typeof expirySource === "string" && expirySource.trim()) {
    const numeric = Number(expirySource);
    if (Number.isFinite(numeric)) {
      expiresAt = Date.now() + Math.max(numeric - 60, 30) * 1000;
    } else {
      const timestamp = Date.parse(expirySource);
      if (!Number.isNaN(timestamp)) {
        expiresAt = timestamp - 60 * 1000;
      }
    }
  }
  const cacheEntry: BearerTokenCache = { token, expiresAt };
  await logTokenRequest("info", "eupago_oauth_token_received", {
    expiresAt: new Date(expiresAt).toISOString(),
  });
  return cacheEntry;
};

const ensureBearerToken = async () => {
  if (bearerTokenCache && bearerTokenCache.expiresAt > Date.now() + 5_000) {
    return bearerTokenCache.token;
  }
  if (bearerTokenPromise) {
    const pending = await bearerTokenPromise;
    bearerTokenCache = pending;
    bearerTokenPromise = null;
    return pending.token;
  }
  bearerTokenPromise = requestBearerToken().catch((error) => {
    bearerTokenPromise = null;
    throw error;
  });
  const fresh = await bearerTokenPromise;
  bearerTokenCache = fresh;
  bearerTokenPromise = null;
  return fresh.token;
};

export type EuPagoReferenceEntry = {
  reference?: string;
  amount?: string | number;
  datetime?: string;
  status?: string;
  identifier?: string;
  method?: string;
  trid?: string | number;
  [key: string]: EuPagoSerializable;
};

type ReferencesResponse = {
  transactionStatus?: string;
  referenceList?: EuPagoReferenceEntry[];
  response?: string;
  code?: string;
  estado?: number;
  sucesso?: boolean;
  [key: string]: EuPagoSerializable;
};

const REFERENCE_STATUS_CACHE_TTL = 30_000;
const referenceStatusCache = new Map<
  string,
  { result: EuPagoReferenceEntry | null; fetchedAt: number }
>();
const DEFAULT_REFERENCE_STATUS_SEQUENCE = [
  "paga",
  "pendente",
  "expirada",
  "cancelada",
  "erro",
  "reembolsada",
  "devolvida",
  "arquivada",
];

const fetchReferencesByStatus = async (status?: string) => {
  const token = await ensureBearerToken();
  const searchParams = new URLSearchParams();
  if (status) searchParams.set("status", status);
  const path = `/api/management/v1.02/references${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  await logEuPagoEvent("info", "eupago_references_request", {
    url: path,
    status,
  });
  const res = await fetch(buildUrl(path), {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": "palmanhac-payments-adapter",
      ApiKey: ensureApiKey(),
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
  const parsed = await parseJsonSafely<ReferencesResponse>(res);
  if (!res.ok || parsed.transactionStatus?.toLowerCase().includes("reject")) {
    await logEuPagoEvent("error", "eupago_references_error", {
      status: res.status,
      url: path,
      response: parsed,
    });
    throw new EuPagoAPIError(
      `EuPago references request failed with status ${res.status}.`,
      parsed,
    );
  }
  await logEuPagoEvent("info", "eupago_references_success", {
    url: path,
    status: res.status,
    entries: parsed.referenceList?.length ?? 0,
  });
  return Array.isArray(parsed.referenceList) ? parsed.referenceList : [];
};

export const lookupReferenceStatus = async (
  reference: string,
  statuses: string[] = DEFAULT_REFERENCE_STATUS_SEQUENCE,
) => {
  const normalized = normaliseDigits(reference);
  if (!normalized) return null;
  const cacheEntry = referenceStatusCache.get(normalized);
  if (cacheEntry && Date.now() - cacheEntry.fetchedAt < REFERENCE_STATUS_CACHE_TTL) {
    return cacheEntry.result;
  }
  for (const status of statuses) {
    const list = await fetchReferencesByStatus(status);
    const match = list.find((entry) => {
      const entryRef = normaliseDigits(entry.reference ?? null);
      return entryRef === normalized;
    });
    if (match) {
      referenceStatusCache.set(normalized, {
        result: { ...match, status: status ?? match.status },
        fetchedAt: Date.now(),
      });
      return match;
    }
  }
  referenceStatusCache.set(normalized, { result: null, fetchedAt: Date.now() });
  return null;
};

const mapReferenceStatus = (status: string | undefined): EuPagoStatusResult["status"] => {
  if (!status) return "unknown";
  const normalized = status.toLowerCase();
  if (normalized.startsWith("pag")) return "paid";
  if (normalized.startsWith("pen")) return "pending";
  if (normalized.startsWith("exp")) return "expired";
  if (normalized.startsWith("can")) return "cancelled";
  if (normalized.startsWith("err")) return "failed";
  if (normalized.startsWith("dev") || normalized.startsWith("reemb")) return "refunded";
  if (normalized.startsWith("arquiv")) return "cancelled";
  return normalized;
};

export const referenceEntryToStatus = (
  entry: EuPagoReferenceEntry | null,
): EuPagoStatusResult | null => {
  if (!entry) return null;
  const status = mapReferenceStatus(
    typeof entry.status === "string" ? entry.status : undefined,
  );
  let paidAt: string | undefined;
  if (entry.datetime) {
    const parsed = Date.parse(entry.datetime);
    paidAt = Number.isNaN(parsed) ? undefined : new Date(parsed).toISOString();
  }
  return {
    status,
    paidAt,
    raw: entry as Record<string, unknown>,
  };
};
