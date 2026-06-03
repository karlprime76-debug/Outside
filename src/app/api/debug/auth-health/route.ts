import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  // Only allow in development or for admins
  try {
    const session = await auth();
    const isDev = process.env.NODE_ENV !== "production";
    const isAdmin = Boolean(session?.user?.role && ["ADMIN", "MODERATOR"].includes(session.user.role as string));

    if (!isDev && !isAdmin) {
      return NextResponse.json({ ok: false, error: "Accès refusé" }, { status: 403 });
    }

    const env = {
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      hasNextAuthSecret: Boolean(process.env.NEXTAUTH_SECRET),
      hasNextAuthUrl: Boolean(process.env.NEXTAUTH_URL),
    };

    let canConnect = false;
    try {
      await db.user.count();
      canConnect = true;
    } catch {
      canConnect = false;
    }

    return NextResponse.json({ ok: true, env, database: { canConnect } });
  } catch {
    return NextResponse.json({ ok: false, error: "Unexpected" }, { status: 500 });
  }
}
