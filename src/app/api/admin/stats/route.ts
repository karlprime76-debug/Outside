import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const [
      pendingVerifications,
      pendingReports,
      pendingProRequests,
      pendingProVenues,
      flaggedLives,
      flaggedAudio,
    ] = await Promise.all([
      db.identityVerification.count({ where: { status: "PENDING" } }),
      db.report.count({ where: { status: { in: ["PENDING", "OPEN", "REVIEWING"] } } }),
      db.proAccount.count({ where: { status: "PENDING" } }),
      db.proVenue.count({ where: { status: "PENDING" } }),
      db.liveSession.count({ where: { status: { in: ["REPORTED", "BLOCKED"] } } }),
      db.audioTrack.count({ where: { status: "PENDING_REVIEW" } }),
    ]);

    return NextResponse.json({
      stats: {
        verifications: pendingVerifications,
        reports: pendingReports,
        proRequests: pendingProRequests,
        proVenues: pendingProVenues,
        lives: flaggedLives,
        audio: flaggedAudio,
      },
    });
  } catch (error) {
    console.error("[ADMIN_STATS_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
