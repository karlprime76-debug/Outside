import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PUBLIC_ROUTES = ["/", "/login", "/register", "/signup/pro"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isAdmin = req.auth?.user?.role === "ADMIN";

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isApiLocationsRoute = nextUrl.pathname.startsWith("/api/locations");
  const isPublicRoute = PUBLIC_ROUTES.includes(nextUrl.pathname) || isApiLocationsRoute;
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");

  // CORS headers
  if (nextUrl.pathname.startsWith("/api")) {
    const response = NextResponse.next();
    const origin = req.headers.get("origin") || "";
    const allowedOrigins = [
      process.env.NEXTAUTH_URL,
      process.env.APP_URL,
      "https://outside-tau.vercel.app",
    ].filter(Boolean) as string[];
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === "development") {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }
    if (req.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }
    return response;
  }

  // API auth routes always open
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // Admin routes protection
  if (isAdminRoute && !isAdmin) {
    return NextResponse.redirect(new URL("/home", nextUrl));
  }

  // Logged in users should not see login/register
  if (isLoggedIn && (nextUrl.pathname === "/login" || nextUrl.pathname === "/register")) {
    return NextResponse.redirect(new URL("/home", nextUrl));
  }

  // Protect private routes with callbackUrl
  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|png|webp|svg|css|js|woff2?)).*)",
  ],
};
