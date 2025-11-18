import { z } from "zod";
import { normalizeCountryInput } from "@/lib/utils/country";

const countryCodeSchema = z
  .string()
  .min(2)
  .max(120)
  .transform((value, ctx) => {
    try {
      return normalizeCountryInput(value);
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: error instanceof Error ? error.message : "Invalid country.",
      });
      return z.NEVER;
    }
  });

const addressSchema = z.object({
  name: z.string().min(1).max(120),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(120),
  postalCode: z.string().min(1).max(60),
  country: countryCodeSchema,
});

export const checkoutPayloadSchema = z.object({
  method: z.enum(["multibanco", "mbway", "card"]),
  items: z
    .array(
      z.object({
        productId: z.number().int().min(1),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1),
  contact: z.object({
    email: z.string().email(),
    phone: z.string().max(50).optional(),
    name: z.string().max(120).optional(),
  }),
  shipping: addressSchema,
  billing: addressSchema,
  notes: z.string().max(500).optional(),
  currency: z.string().default("EUR"),
  locale: z.string().optional(),
  mbwayPhone: z.string().max(20).optional(),
  totals: z
    .object({
      itemsSubtotalCents: z.number().int().nonnegative(),
      deliveryCents: z.number().int().nonnegative(),
      discountCents: z.number().int().nonnegative(),
      totalCents: z.number().int().positive(),
    })
    .optional(),
});

export type CheckoutPayload = z.infer<typeof checkoutPayloadSchema>;

export const normalizeCurrency = (currency: string) =>
  currency.trim().toUpperCase() || "EUR";

export const parseMbwayPhone = (input: string) => {
  const digits = input.replace(/\D/g, "");
  if (digits.length < 9) {
    throw new Error("Invalid phone number.");
  }
  const msisdn = digits.slice(-9);
  const countryCode = digits.length > 9 ? digits.slice(0, digits.length - 9) : "351";
  return { phone: msisdn, countryCode };
};
