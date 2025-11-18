const SENSITIVE_KEY_PATTERNS = [
  "apikey",
  "api_key",
  "api-key",
  "key",
  "secret",
  "token",
  "signature",
  "password",
  "pass",
  "authorization",
  "cookie",
  "email",
  "phone",
  "alias",
  "customer",
  "address",
  "line1",
  "line2",
  "city",
  "postal",
  "zip",
  "country",
  "name",
  "notes",
  "reference",
  "transaction",
  "card",
  "iban",
  "entity",
];

const SENSITIVE_VALUE_PATTERNS = [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, /^\+?\d[0-9()\s-]{5,}$/];

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Object.prototype.toString.call(value) === "[object Object]";

const shouldRedactKey = (key: string) => {
  const lowered = key.toLowerCase();
  return SENSITIVE_KEY_PATTERNS.some((pattern) => lowered.includes(pattern));
};

const shouldRedactValue = (value: unknown) =>
  typeof value === "string" &&
  (SENSITIVE_VALUE_PATTERNS.some((pattern) => pattern.test(value)) || value.length > 40);

const maskString = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "<redacted>";
  if (trimmed.length <= 4) return `${trimmed[0] ?? "*"}***`;
  const [localPartRaw, domain] = trimmed.split("@");
  const localPart = localPartRaw ?? "";
  if (domain) {
    const safeLocal =
      localPart.length <= 2
        ? `${localPart.charAt(0) || "*"}***`
        : `${localPart.slice(0, 2)}***`;
    return `${safeLocal}@${domain}`;
  }
  return `${trimmed.slice(0, 3)}***${trimmed.slice(-2)}`;
};

const maskValue = (value: unknown): unknown => {
  if (typeof value === "string") {
    return maskString(value);
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? "[redacted-number]" : "<redacted>";
  }
  if (Array.isArray(value)) {
    return value.map(() => "<redacted>");
  }
  if (value && typeof value === "object") {
    return "[redacted]";
  }
  return "<redacted>";
};

const redactInternal = (input: unknown, seen: WeakSet<object>): unknown => {
  if (input === null || input === undefined) {
    return input;
  }

  if (input instanceof Date) {
    return input.toISOString();
  }

  if (Array.isArray(input)) {
    return input.map((item) => redactInternal(item, seen));
  }

  if (!isPlainObject(input)) {
    if (shouldRedactValue(input)) {
      return maskValue(input);
    }
    return input;
  }

  if (seen.has(input)) {
    return "[circular]";
  }
  seen.add(input);

  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    if (shouldRedactKey(key) || shouldRedactValue(value)) {
      output[key] = maskValue(value);
      continue;
    }
    output[key] = redactInternal(value, seen);
  }
  return output;
};

export const redactForLogging = <T>(input: T): T =>
  redactInternal(input, new WeakSet()) as T;
