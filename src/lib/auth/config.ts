import { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Instagram from "next-auth/providers/instagram";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validation/schemas";
import { rateLimit } from "@/lib/rate-limit";

export const authConfig: NextAuthConfig = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })]
      : []),
    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
      ? [Facebook({ clientId: process.env.FACEBOOK_CLIENT_ID, clientSecret: process.env.FACEBOOK_CLIENT_SECRET })]
      : []),
    ...(process.env.INSTAGRAM_CLIENT_ID && process.env.INSTAGRAM_CLIENT_SECRET
      ? [Instagram({ clientId: process.env.INSTAGRAM_CLIENT_ID, clientSecret: process.env.INSTAGRAM_CLIENT_SECRET })]
      : []),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials, request) => {
        try {
          // Rate-limit brute-force par IP
          const ip = request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim()
            || request?.headers?.get("x-real-ip")
            || "unknown";
          const limit = await rateLimit(`login:${ip}`, 5, 300_000);
          if (!limit.success) {
            throw new Error("RATE_LIMITED");
          }

          const parsed = loginSchema.safeParse(credentials);
          if (!parsed.success) {
            throw new Error("MISSING_FIELDS");
          }

          // Normalize inputs to reduce false negatives from autofill/spaces/case
          const emailNorm = parsed.data.email.trim().toLowerCase();
          const passwordNorm = parsed.data.password.trim();

          const user = await db.user.findFirst({
            where: { email: { equals: emailNorm, mode: "insensitive" } },
            include: {
              homeCity: true,
              activeCity: true,
            },
          });

          if (!user) return null; // user not found → invalid credentials
          if (!user.password) throw new Error("NO_PASSWORD");

          const valid = await bcrypt.compare(passwordNorm, user.password);
          if (!valid) return null; // wrong password → invalid credentials

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            username: user.username,
            image: user.image,
            role: user.role,
            country: user.country,
            countryCode: user.countryCode,
            homeCity: user.homeCity?.name || null,
            activeCity: user.activeCity?.name || null,
            homeCityId: user.homeCityId,
            activeCityId: user.activeCityId,
            accountKind: user.accountKind,
          };
        } catch (error: unknown) {
          // Server/Prisma error → log securely and surface as AUTH_SERVER_ERROR
          // eslint-disable-next-line no-console
          {
            const err = error as { message?: string; name?: string; code?: string };
            console.error("[AUTH_LOGIN_ERROR]", {
              message: err?.message,
              name: err?.name,
              code: err?.code,
            });
            throw new Error(err?.message === "NO_PASSWORD" ? "NO_PASSWORD" : "AUTH_SERVER_ERROR");
          }
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (!account || account.type === "credentials") return true;
      if (!profile) return false;
      if (!profile.email && account.provider !== "instagram") return false;

      let email = profile.email as string | undefined;

      if (account.provider === "instagram" && !email) {
        const p = profile as Record<string, string>;
        const username = p.username || p.id;
        if (!username) return false;
        email = `instagram-${username}@outside.app`;
      }

      if (!email) return false;

      try {
        const existing = await db.user.findUnique({ where: { email } });
        if (existing) return true;

        const name = (profile.name as string) || email.split("@")[0];
        const image = (profile.picture as string) || null;

        const baseUsername = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20) || email.split("@")[0];
        let username = baseUsername;
        let attempt = 0;
        while (await db.user.findUnique({ where: { username } })) {
          attempt++;
          username = `${baseUsername}${attempt}`;
        }

        await db.user.create({
          data: { email, name, username, image, emailVerified: new Date() },
        });

        return true;
      } catch {
        return false;
      }
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const u = user as Record<string, unknown>;
        token.role = u.role ?? "USER";
        token.accountKind = u.accountKind ?? "STANDARD";
        token.username = u.username ?? null;
        token.image = user.image;
        token.country = u.country ?? null;
        token.countryCode = u.countryCode ?? null;
        token.homeCity = u.homeCity ?? null;
        token.activeCity = u.activeCity ?? null;
        token.homeCityId = u.homeCityId ?? null;
        token.activeCityId = u.activeCityId ?? null;
      }
      // On sign-in, embed tokenVersion from DB for revocation capability
      if (trigger === "signIn" || trigger === "signUp") {
        try {
          const u = await db.user.findUnique({
            where: { id: token.sub },
            select: { tokenVersion: true },
          });
          token.tokenVersion = u?.tokenVersion ?? 0;
        } catch {
          token.tokenVersion = 0;
        }
      }
      // Mise à jour du token lors d'un update() client
      if (trigger === "update" && session?.image) {
        token.image = session.image;
      }
      if (trigger === "update" && session?.username) {
        token.username = session.username;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      if (token.role) {
        session.user.role = String(token.role);
      }
      if (token.accountKind) {
        session.user.accountKind = String(token.accountKind);
      }
      if (token.username) {
        session.user.username = String(token.username);
      }
      if (token.country) {
        session.user.country = String(token.country);
      }
      if (token.countryCode) {
        session.user.countryCode = String(token.countryCode);
      }
      if (token.homeCity) {
        session.user.homeCity = String(token.homeCity);
      }
      if (token.activeCity) {
        session.user.activeCity = String(token.activeCity);
      }
      if (token.homeCityId) {
        session.user.homeCityId = String(token.homeCityId);
      }
      if (token.activeCityId) {
        session.user.activeCityId = String(token.activeCityId);
      }
      if (token.image) {
        session.user.image = String(token.image);
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
};
