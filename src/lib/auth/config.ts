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
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await db.user.findUnique({
          where: { email },
          include: {
            homeCity: true,
            activeCity: true,
          },
        });

        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

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
        };
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
    maxAge: 30 * 24 * 60 * 60,
  },
};
