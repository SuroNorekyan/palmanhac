import { auth } from "@/auth";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class TwoFactorRequiredError extends Error {
  constructor(message = "Two-factor authentication required.") {
    super(message);
    this.name = "TwoFactorRequiredError";
  }
}

export const requireAdminSession = async () => {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new UnauthorizedError();
  }
  if (session.user.twoFAEnabled && !session.twoFAVerified) {
    throw new TwoFactorRequiredError();
  }
  return session;
};
