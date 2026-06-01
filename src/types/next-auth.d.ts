import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    country?: string | null;
    countryCode?: string | null;
    homeCity?: string | null;
    activeCity?: string | null;
  }

  interface Session {
    user: {
      id?: string;
      role?: string;
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
    country?: string | null;
    countryCode?: string | null;
    homeCity?: string | null;
    activeCity?: string | null;
  }
}
