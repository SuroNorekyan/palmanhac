// auth.ts
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import { verifyPassword } from "@/lib/security/password";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { prisma } from "@/lib/server/db";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const providers: Provider[] = [
  Credentials({
    async authorize(credentials) {
      const parsed = credentialsSchema.safeParse(credentials);
      if (!parsed.success) return null;

      const { email, password } = parsed.data;

      const rateKey = `auth:signin:${email.toLowerCase()}`;
      const rate = consumeRateLimit(rateKey, 5, 60_000);
      if (!rate.success) throw new Error("Too many attempts. Try again shortly.");

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (!user?.passwordHash) return null;

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) return null;

      // Return minimal fields; we'll copy these into the JWT
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        twoFAEnabled: user.twoFAEnabled,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: false,
    }),
  );
}

const ONE_HOUR = 60 * 60;

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),

  // ✅ Switch to JWT sessions to enable Credentials
  session: {
    strategy: "jwt",
    maxAge: ONE_HOUR * 4,
    updateAge: 15 * 60,
  },

  trustHost: true,
  providers,

  // ✅ Use JWT to carry role / 2FA flags
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // On initial sign-in, merge user fields onto the token
      if (user) {
        token.userId = user.id as string;
        token.role = (user as any).role;
        token.twoFAEnabled = (user as any).twoFAEnabled ?? false;

        // Optionally, set 2FA verified false on initial sign-in
        token.twoFAVerified = false;
      }

      // Optional: allow explicit updates (e.g., after a successful 2FA challenge)
      if (trigger === "update" && session) {
        if (typeof session.twoFAVerified === "boolean") {
          token.twoFAVerified = session.twoFAVerified;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (!session.user) return session;

      // Copy JWT fields to the session object
      session.user.id = (token as any).userId as string;
      (session.user as any).role = (token as any).role;
      (session.user as any).twoFAEnabled = (token as any).twoFAEnabled ?? false;

      // Expose a top-level flag if you used it previously
      (session as any).twoFAVerified = (token as any).twoFAVerified ?? false;

      return session;
    },

    async signIn({ user, account }) {
      if (
        account?.provider === "google" &&
        "emailVerified" in user &&
        !user.emailVerified
      ) {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        });
      }
      return true;
    },
  },

  // ❌ Remove sessionToken cookie override (only applies to database sessions)
  // cookies: { ... }  <-- delete this whole block

  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
});
