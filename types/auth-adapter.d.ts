import type { Role } from "@prisma/client";

declare module "@auth/core/adapters" {
  interface AdapterUser {
    role: Role;
    twoFAEnabled: boolean;
  }
}
