import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const tickets = await db.ticket.findMany({
      where: {
        userId: session.user.id,
        status: { in: ["COMPLETED", "USED"] },
      },
      include: {
        plan: {
          select: {
            id: true,
            title: true,
            startDate: true,
            place: { select: { name: true } },
            city: { select: { name: true } },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const mapped = tickets.map((t) => ({
      ...t,
      plan: {
        ...t.plan,
        locationName: t.plan.place?.name ?? null,
        place: undefined,
      },
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("[TICKETS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
