import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { isAmbassador, ambassadorCity } = await req.json();

    const updatedUser = await db.user.update({
      where: { id },
      data: {
        isAmbassador: isAmbassador ?? true,
        ambassadorCity: ambassadorCity ?? null,
      },
      select: {
        id: true,
        username: true,
        isAmbassador: true,
        ambassadorCity: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[ADMIN_UPDATE_AMBASSADOR_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
