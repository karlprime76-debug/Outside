import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.reason) {
      return NextResponse.json({ error: "Reason required" }, { status: 400 });
    }

    const report = await db.report.create({
      data: {
        reporterId: user.id,
        reportedUserId: body.reportedUserId || null,
        planId: body.planId || null,
        placeId: body.placeId || null,
        reason: body.reason,
        description: body.description || null,
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("Create report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
