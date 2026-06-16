import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    const isAdmin = Boolean(session?.user?.role && ["ADMIN", "MODERATOR"].includes(session.user.role as string));
    if (!isAdmin) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let canConnect = false;
    try {
      await db.user.count();
      canConnect = true;
    } catch {
      canConnect = false;
    }

    return NextResponse.json({ ok: true, database: { canConnect } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
