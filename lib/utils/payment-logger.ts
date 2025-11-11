import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

type PaymentLogLevel = "debug" | "info" | "warn" | "error";

const LOG_DIR = join(process.cwd(), "logs");
const LOG_FILE = join(LOG_DIR, "payments.log");

let ensureDirPromise: Promise<void> | null = null;

const ensureLogDir = async () => {
  if (!ensureDirPromise) {
    ensureDirPromise = mkdir(LOG_DIR, { recursive: true })
      .then(() => {})
      .catch((error) => {
        ensureDirPromise = null;
        throw error;
      });
  }
  return ensureDirPromise;
};

export const logPaymentEvent = async (
  level: PaymentLogLevel,
  event: string,
  details: Record<string, unknown> = {},
) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    details,
  };

  const consoleMethod =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : level === "debug"
          ? console.debug
          : console.info;

  try {
    consoleMethod?.call(console, `[Payments] ${event}`, details);
  } catch {
    // Ignore console failures
  }

  if (process.env.NODE_ENV === "test") {
    return;
  }

  try {
    await ensureLogDir();
    await appendFile(LOG_FILE, JSON.stringify(entry) + "\n", "utf8");
  } catch (error) {
    console.warn("[Payments] Failed to write log entry", error);
  }
};
