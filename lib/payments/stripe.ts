import Stripe from "stripe";

let stripeClient: Stripe | null = null;

const resolveSecretKey = () => {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  return secret;
};

export const getStripeClient = () => {
  if (!stripeClient) {
    stripeClient = new Stripe(resolveSecretKey(), {
      typescript: true,
    });
  }
  return stripeClient;
};
