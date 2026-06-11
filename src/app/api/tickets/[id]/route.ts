import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const ticket = await db.ticket.findUnique({
      where: {
        id: id,
      },
      include: {
        plan: {
          include: {
            city: { select: { name: true } },
            creator: { select: { name: true, image: true } },
          },
        },
      },
    });

    if (!ticket) {
      return new NextResponse("Ticket not found", { status: 404 });
    }

    // Only user who bought or organizer/admin can see details
    if (ticket.userId !== session.user.id && session.user.role !== "ADMIN" && ticket.plan.creatorId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("[TICKET_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
