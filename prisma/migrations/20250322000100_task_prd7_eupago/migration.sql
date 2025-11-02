-- Drop legacy Stripe-centric payment intent structures
DROP TABLE IF EXISTS "PaymentIntent";
DROP TYPE IF EXISTS "PaymentIntentStatus";

-- Create new payment method enum to track EuPago channel
CREATE TYPE "PaymentMethod" AS ENUM ('MULTIBANCO', 'MBWAY', 'CARD');

-- Extend orders with provider, addressing, and audit metadata
ALTER TABLE "Order"
  ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'EUR',
  ADD COLUMN "paymentProvider" "PaymentProvider" NOT NULL DEFAULT 'EUPAGO',
  ADD COLUMN "paymentMethod" "PaymentMethod",
  ADD COLUMN "providerRef" TEXT,
  ADD COLUMN "providerMetadata" JSONB,
  ADD COLUMN "contactEmail" TEXT,
  ADD COLUMN "contactPhone" TEXT,
  ADD COLUMN "shippingAddress" JSONB,
  ADD COLUMN "billingAddress" JSONB,
  ADD COLUMN "locale" TEXT,
  ADD COLUMN "paidAt" TIMESTAMP(3),
  ADD COLUMN "events" JSONB DEFAULT '[]'::jsonb;

-- Ensure provider references remain unique when present
CREATE UNIQUE INDEX "Order_providerRef_key" ON "Order"("providerRef");
