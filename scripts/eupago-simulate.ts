import { createCard, createMBWay, createMultibanco } from "../lib/payments/eupago.ts";
import type { EuPagoOrderInput } from "../lib/payments/eupago.ts";

process.env.EUPAGO_API_BASE = process.env.EUPAGO_API_BASE ?? "https://sandbox.eupago.pt";
process.env.EUPAGO_API_KEY = process.env.EUPAGO_API_KEY ?? "demo-74d6-183e-c5b9-480";
process.env.EUPAGO_CARD_RETURN_URL =
  process.env.EUPAGO_CARD_RETURN_URL ?? "http://localhost:3000/orders";

const logFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;
  console.log("[Simulation] fetch url", url);
  console.log("[Simulation] fetch options", init);

  if (url.includes("/creditcard/")) {
    return new Response(
      JSON.stringify({
        payment_url: "https://sandbox.eupago.pt/pay/mock-card",
        transaction_id: "card_sim_123",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  if (url.includes("/mbway/")) {
    return new Response(
      JSON.stringify({
        transaction_id: "mbway_sim_123",
        status_url: "https://sandbox.eupago.pt/status/mock-mbway",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  if (url.includes("/multibanco/")) {
    return new Response(
      JSON.stringify({
        entidade: "12345",
        referencia: "555777888",
        valor: "66.49",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response("Not implemented", { status: 501 });
};

globalThis.fetch = logFetch as typeof fetch;

const baseOrder: EuPagoOrderInput = {
  orderId: "simulation-order",
  amountCents: 6649,
  currency: "EUR",
  description: "Order simulation-order",
  customer: {
    email: "sandbox@example.com",
    name: "Palmanhac Demo",
    phone: "911234567",
  },
  shipping: {
    name: "Palmanhac Demo",
    line1: "Rua das Flores 1",
    city: "Porto",
    postalCode: "4000-001",
    country: "PT",
  },
  billing: {
    name: "Palmanhac Demo",
    line1: "Rua das Flores 1",
    city: "Porto",
    postalCode: "4000-001",
    country: "PT",
  },
  locale: "en",
};

const runSimulation = async () => {
  console.log("[Simulation] Starting EuPago adapter simulation");

  const cardResult = await createCard(baseOrder);
  console.log("[Simulation] Card result", cardResult);

  const mbwayResult = await createMBWay({ ...baseOrder, phone: "911234567" });
  console.log("[Simulation] MB WAY result", mbwayResult);

  const multibancoResult = await createMultibanco(baseOrder);
  console.log("[Simulation] Multibanco result", multibancoResult);
};

runSimulation().catch((error) => {
  console.error("[Simulation] Failed", error);
  process.exitCode = 1;
});
