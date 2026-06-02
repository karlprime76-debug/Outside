import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    username?: string | null;
    image?: string | null;
    country?: string | null;
    countryCode?: string | null;
    homeCity?: string | null;
    activeCity?: string | null;
  }

  interface Session {
    user: {
      id?: string;
      role?: string;
      username?: string | null;
      country?: string | null;
      countryCode?: string | null;
      homeCity?: string | null;
      activeCity?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    username?: string | null;
    image?: string | null;
    country?: string | null;
    countryCode?: string | null;
    homeCity?: string | null;
    activeCity?: string | null;
  }
}
