import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const OFFICIAL_USERNAMES = ["outside_officiel", "outside_guide"];

export async function GET() {
  try {
    const users = await db.user.findMany({
      where: { username: { in: OFFICIAL_USERNAMES } },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        isVerified: true,
        accountKind: true,
      },
    });

    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ users: [] });
  }
}
