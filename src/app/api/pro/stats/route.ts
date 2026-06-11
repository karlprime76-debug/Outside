import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        _count: {
          select: {
            plansCreated: true,
            moments: true,
            referralInvites: {
              where: { acceptedUserId: { not: null } }
            }
          }
        },
        plansCreated: {
          select: {
            _count: {
              select: {
                participants: true,
                savedPlans: true,
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    if (user.role !== "PRO" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès réservé aux comptes PRO" }, { status: 403 });
    }

    // Calculer l'engagement total
    const totalParticipants = user.plansCreated.reduce((acc, plan) => acc + plan._count.participants, 0);
    const totalSaves = user.plansCreated.reduce((acc, plan) => acc + plan._count.savedPlans, 0);

    const stats = {
      plansCount: user._count.plansCreated,
      momentsCount: user._count.moments,
      referralsCount: user._count.referralInvites,
      totalParticipants,
      totalSaves,
      engagementRate: totalParticipants > 0 ? ((totalSaves / totalParticipants) * 100).toFixed(1) : 0,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("[PRO_STATS_ERROR]", error);
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}
