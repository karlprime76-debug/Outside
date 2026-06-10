import { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validation/schemas";

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
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
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.username = user.username;
        token.image = user.image;
        token.country = user.country;
        token.countryCode = user.countryCode;
        token.homeCity = user.homeCity;
        token.activeCity = user.activeCity;
        token.homeCityId = user.homeCityId;
        token.activeCityId = user.activeCityId;
      }
      // On sign-in, embed tokenVersion from DB for revocation capability
      if (trigger === "signIn" || trigger === "signUp") {
        // Fetch latest tokenVersion asynchronously — stored in JWT for validation
        db.user.findUnique({
          where: { id: token.sub },
          select: { tokenVersion: true },
        }).then((u) => {
          token.tokenVersion = u?.tokenVersion ?? 0;
        }).catch(() => {
          token.tokenVersion = 0;
        });
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
        session.user.role = token.role as string;
      }
      if (token.username) {
        session.user.username = token.username as string;
      }
      if (token.country) {
        session.user.country = token.country as string;
      }
      if (token.countryCode) {
        session.user.countryCode = token.countryCode as string;
      }
      if (token.homeCity) {
        session.user.homeCity = token.homeCity as string;
      }
      if (token.activeCity) {
        session.user.activeCity = token.activeCity as string;
      }
      if (token.homeCityId) {
        session.user.homeCityId = token.homeCityId as string;
      }
      if (token.activeCityId) {
        session.user.activeCityId = token.activeCityId as string;
      }
      if (token.image) {
        session.user.image = token.image as string;
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
