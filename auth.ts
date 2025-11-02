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
        select: {
          id: true,
          email: true,
          name: true,
          passwordHash: true,
          role: true,
          twoFAEnabled: true,
          emailVerified: true,
        },
      });
      if (!user?.passwordHash) return null;

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) return null;

      // Return minimal fields; we'll move them to the JWT
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        twoFAEnabled: user.twoFAEnabled,
        emailVerified: user.emailVerified,
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

  // ✅ JWT sessions so Credentials work and we can carry admin fields
  session: {
    strategy: "jwt",
    maxAge: ONE_HOUR * 4,
    updateAge: 15 * 60,
  },

  // ✅ Send framework sign-in redirects to a localized page (dev default = en)
  pages: {
    signIn: "/en/account",
  },

  trustHost: true,
  providers,

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // On first sign in, enrich token
      if (user) {
        token.sub = (user as any).id ?? token.sub;
        (token as any).role = (user as any).role ?? "USER";
        (token as any).twoFAEnabled = Boolean((user as any).twoFAEnabled);
        // New session is not 2FA-verified until challenge passes
        (token as any).twoFAVerified = false;
      }

      // Allow explicit updates (e.g., after 2FA verify)
      if (trigger === "update" && session) {
        if (typeof (session as any).twoFAVerified === "boolean") {
          (token as any).twoFAVerified = (session as any).twoFAVerified;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (!session.user) return session;

      // Expose token fields to session
      session.user.id = token.sub as string;
      (session.user as any).role = (token as any).role ?? "USER";
      (session.user as any).twoFAEnabled = Boolean((token as any).twoFAEnabled);
      (session as any).twoFAVerified = Boolean((token as any).twoFAVerified);

      return session;
    },

    async signIn({ user, account }) {
      // Mark Google users verified on first login (optional)
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

  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
});
