import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const ticket = await db.ticket.findUnique({
      where: { id: params.id },
      include: {
        plan: {
          select: {
            id: true,
            creatorId: true,
            title: true,
          }
        },
        user: {
          select: {
            name: true,
            image: true,
          }
        }
      }
    });

    if (!ticket) {
      return new NextResponse("Ticket introuvable.", { status: 404 });
    }

    // Only creator of the plan or admin can validate
    if (ticket.plan.creatorId !== session.user.id && session.user.role !== "ADMIN") {
      return new NextResponse("Vous n'avez pas l'autorisation de valider ce billet.", { status: 403 });
    }

    if (ticket.scannedAt) {
      return NextResponse.json({ 
        success: false, 
        message: "Ce billet a déjà été utilisé.",
        ticket: {
          ...ticket,
          user: ticket.user,
        }
      }, { status: 400 });
    }

    const updatedTicket = await db.ticket.update({
      where: { id: params.id },
      data: {
        scannedAt: new Date(),
        scannedById: session.user.id,
        status: "USED",
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          }
        }
      }
    });

    // Automatically join the plan if not already participant (for analytics/trust)
    try {
      const participant = await db.planParticipant.findUnique({
        where: {
          planId_userId: {
            planId: ticket.planId,
            userId: ticket.userId,
          }
        }
      });

      if (!participant) {
        await db.planParticipant.create({
          data: {
            planId: ticket.planId,
            userId: ticket.userId,
            attendance: "GOING",
            checkedInAt: new Date(),
          }
        });
      } else if (!participant.checkedInAt) {
        await db.planParticipant.update({
          where: { id: participant.id },
          data: { checkedInAt: new Date() }
        });
      }
    } catch (err) {
      console.error("[TICKET_PARTICIPANT_SYNC_ERROR]", err);
    }

    return NextResponse.json({
      success: true,
      message: "Billet validé avec succès !",
      ticket: updatedTicket
    });
  } catch (error) {
    console.error("[TICKET_VALIDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
