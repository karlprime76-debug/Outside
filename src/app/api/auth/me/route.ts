import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { recordTripHistory } from "@/lib/passport";
import { getUserGamificationData } from "@/lib/gamification";
import * as bcrypt from "bcryptjs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitizeUser(user: any) {
  return {
    ...user,
    password: undefined,
    email: undefined,
    birthDate: undefined,
    gender: undefined,
    phone: undefined,
    phoneVerified: undefined,
    emailVerified: undefined,
    identityVerificationStatus: undefined,
    termsAcceptedAt: undefined,
    privacyAcceptedAt: undefined,
    trustScore: undefined,
    referralCode: undefined,
    _count: undefined,
  };
}

export async function GET() {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      include: {
        homeCity: true,
        activeCity: true,
        _count: {
          select: {
            plansCreated: true,
            moments: true,
            friendshipsInitiated: true,
            friendshipsReceived: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const stats = {
      plansCount: user._count.plansCreated,
      momentsCount: user._count.moments,
      friendsCount: user._count.friendshipsInitiated + user._count.friendshipsReceived,
    };

    const gamification = await getUserGamificationData(user.id);

    return NextResponse.json({ 
      user: sanitizeUser(user),
      stats,
      gamification
    });
  } catch (error) {
    console.error("Get me error:", error);
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();

    const prevUser = await db.user.findUnique({
      where: { id: user.id },
      select: { homeCityId: true, activeCityId: true },
    });

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        bio: body.bio !== undefined ? body.bio || null : undefined,
        neighborhood: body.neighborhood !== undefined ? body.neighborhood || null : undefined,
        preferredBudget: body.preferredBudget !== undefined ? body.preferredBudget || null : undefined,
        language: body.language || undefined,
        preferredMoods: body.preferredMoods?.length ? body.preferredMoods : undefined,
        activeCityId: body.activeCityId || undefined,
        homeCityId: body.homeCityId || undefined,
        country: body.country !== undefined ? body.country || undefined : undefined,
        countryCode: body.countryCode !== undefined ? body.countryCode || undefined : undefined,
      },
      include: {
        homeCity: true,
        activeCity: true,
      },
    });

    // Record trip history when changing active city (travel mode)
    if (body.activeCityId && body.activeCityId !== prevUser?.homeCityId && body.activeCityId !== prevUser?.activeCityId) {
      const newCity = updated.activeCity;
      if (newCity?.name) {
        recordTripHistory({
          userId: user.id,
          city: newCity.name,
          countryCode: updated.countryCode || undefined,
          source: "TRAVEL_MODE",
        }).catch((err) => {
          if (process.env.NODE_ENV === "development") {
            console.error("[PATCH ME] Trip history error:", err);
          }
        });
      }
    }

    return NextResponse.json({ user: sanitizeUser(updated) });
  } catch (error) {
    console.error("Patch me error:", error);
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const password = body.password as string | undefined;
    if (!password || !user.password) {
      return NextResponse.json({ error: "Mot de passe requis pour supprimer le compte." }, { status: 400 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 403 });
    }

    await db.user.delete({ where: { id: user.id } });
    return NextResponse.json({ message: "Compte supprimé." });
  } catch (error) {
    console.error("Delete me error:", error);
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}
