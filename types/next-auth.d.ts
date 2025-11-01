import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
      twoFAEnabled: boolean;
    };
    twoFAVerified: boolean;
  }

  interface User {
    role: Role;
    twoFAEnabled: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    twoFAEnabled?: boolean;
    twoFAVerified?: boolean;
  }
}
