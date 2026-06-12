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
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            title: true,
            createdAt: true,
            city: true,
            status: true,
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

    const totalParticipants = user.plansCreated.reduce((acc, plan) => acc + plan._count.participants, 0);
    const totalSaves = user.plansCreated.reduce((acc, plan) => acc + plan._count.savedPlans, 0);
    const engagementRate = totalParticipants > 0 ? ((totalSaves / totalParticipants) * 100).toFixed(1) : "0";

    const score = Math.min(100, Math.round(
      (parseFloat(engagementRate) / 100) * 40 +
      Math.min(user._count.plansCreated, 20) * 1 +
      Math.min(user._count.moments, 15) * 1 +
      Math.min(user._count.referralInvites, 15) * 1 +
      Math.min(totalParticipants, 100) / 100 * 10
    ));

    const stats = {
      plansCount: user._count.plansCreated,
      momentsCount: user._count.moments,
      referralsCount: user._count.referralInvites,
      totalParticipants,
      totalSaves,
      engagementRate,
      score,
    };

    const recentActivity = user.plansCreated.map((plan) => ({
      id: plan.id,
      title: plan.title,
      city: plan.city,
      createdAt: plan.createdAt,
      participantsCount: plan._count.participants,
      savesCount: plan._count.savedPlans,
    }));

    return NextResponse.json({ stats, recentActivity });
  } catch (error) {
    console.error("[PRO_STATS_ERROR]", error);
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}
