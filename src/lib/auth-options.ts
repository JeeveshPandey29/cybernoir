import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { recordAuditEvent } from "@/lib/audit";
import { createUser, getUserByEmail, getUserByUsername } from "@/lib/db";
import { consumeRateLimit } from "@/lib/rate-limit";

async function resolveUniqueUsername(base: string) {
  const normalizedBase = base.trim() || "user";
  let candidate = normalizedBase;
  let suffix = 1;

  while (await getUserByUsername(candidate)) {
    suffix += 1;
    candidate = `${normalizedBase}${suffix}`;
  }

  return candidate;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
    updateAge: 60 * 60,
  },
  jwt: {
    maxAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.trim().toLowerCase();
        const ip =
          req?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          req?.headers?.get("x-real-ip") ||
          null;
        const rateLimit = consumeRateLimit(`user-login:${email}`, 8, 15 * 60 * 1000);
        if (!rateLimit.allowed) {
          await recordAuditEvent({
            action: "LOGIN",
            status: "FAILURE",
            actorEmail: email,
            ipAddress: ip,
            route: "/api/auth/callback/credentials",
            metadata: { reason: "RATE_LIMITED" },
          });
          return null;
        }

        const user = await getUserByEmail(email);
        if (!user || !user.password) {
          await recordAuditEvent({
            action: "LOGIN",
            status: "FAILURE",
            actorEmail: email,
            ipAddress: ip,
            route: "/api/auth/callback/credentials",
            metadata: { reason: "USER_NOT_FOUND" },
          });
          return null;
        }

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) {
          await recordAuditEvent({
            action: "LOGIN",
            status: "FAILURE",
            actorEmail: email,
            ipAddress: ip,
            route: "/api/auth/callback/credentials",
            metadata: { reason: "INVALID_PASSWORD" },
          });
          return null;
        }

        await recordAuditEvent({
          action: "LOGIN",
          status: "SUCCESS",
          actorUserId: user.id,
          actorEmail: user.email,
          ipAddress: ip,
          route: "/api/auth/callback/credentials",
          metadata: { provider: "credentials" },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.username,
          image: user.avatar,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const existing = await getUserByEmail(user.email);

        if (!existing) {
          const adminEmail = process.env.ADMIN_EMAIL || "";
          const preferredUsername = user.name || user.email.split("@")[0];
          const username = await resolveUniqueUsername(preferredUsername);

          await createUser({
            email: user.email,
            username,
            avatar: user.image || null,
            role: user.email === adminEmail ? "ADMIN" : "USER",
          });
        }
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      if (token.email) {
        const dbUser = await getUserByEmail(token.email);

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.username = dbUser.username;
          token.avatar = dbUser.avatar;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.id;
        (session.user as Record<string, unknown>).role = token.role;
        (session.user as Record<string, unknown>).username = token.username;
        (session.user as Record<string, unknown>).avatar = token.avatar;
      }

      return session;
    },
  },
};
