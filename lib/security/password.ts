import { z } from "zod";

const DEFAULT_COST = 12;
type BcryptModule = typeof import("bcrypt");
let bcryptPromise: Promise<BcryptModule> | null = null;

const loadBcrypt = async (): Promise<BcryptModule> => {
  if (!bcryptPromise) {
    bcryptPromise = import("bcrypt") as Promise<BcryptModule>;
  }
  return bcryptPromise;
};

export const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/\d/, "Password must include a number.");

const resolveCost = () => {
  const envCost = Number.parseInt(process.env.BCRYPT_COST ?? "", 10);
  if (Number.isFinite(envCost) && envCost >= 10 && envCost <= 14) {
    return envCost;
  }
  return DEFAULT_COST;
};

export const hashPassword = async (password: string) => {
  const cost = resolveCost();
  const bcrypt = await loadBcrypt();
  return bcrypt.hash(password, cost);
};

export const verifyPassword = async (password: string, hash: string) => {
  const bcrypt = await loadBcrypt();
  return bcrypt.compare(password, hash);
};
