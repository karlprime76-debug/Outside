import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logError, logPerfEnd, logPerfStart } from "@/lib/log";
import { getCurrentUser } from "@/lib/auth/session";

const ALLOWED_FIELDS = [
  "profileVisibility",
  "showCityOnProfile",
  "allowFriendRequests",
  "allowFollowers",
  "allowFriendSuggestions",
  "notificationFriendRequests",
  "notificationPlanInvites",
  "notificationLiveStarted",
  "notificationCityLives",
  "notificationProEvents",
  "notificationMoments",
  "pushEnabled",
  "pushDm",
  "pushPlans",
  "pushMoments",
  "pushLive",
  "pushPro",
] as const;

export async function GET() {
  const perfLabel = "[PERF] GET /api/settings";
  logPerfStart(perfLabel);

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tu dois être connecté." }, { status: 401 });
    }

    let settings = await db.userSettings.findUnique({
      where: { userId: user.id },
    });

    if (!settings) {
      settings = await db.userSettings.create({
        data: { userId: user.id },
      });
    }

    logPerfEnd(perfLabel);
    return NextResponse.json({ settings });
  } catch (error) {
    logPerfEnd(perfLabel);
    logError("[SETTINGS_ERROR]", "GET /api/settings failed", { error: String(error) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const perfLabel = "[PERF] PATCH /api/settings";
  logPerfStart(perfLabel);

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tu dois être connecté." }, { status: 401 });
    }

    const body = await req.json();

    const updateData: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (body[key] !== undefined) {
        if (typeof body[key] === "boolean" || typeof body[key] === "string") {
          updateData[key] = body[key];
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
    }

    let settings = await db.userSettings.findUnique({
      where: { userId: user.id },
    });

    if (!settings) {
      settings = await db.userSettings.create({
        data: { userId: user.id, ...updateData },
      });
    } else {
      settings = await db.userSettings.update({
        where: { userId: user.id },
        data: updateData,
      });
    }

    logPerfEnd(perfLabel);
    return NextResponse.json({ message: "Paramètres mis à jour.", settings });
  } catch (error) {
    logPerfEnd(perfLabel);
    logError("[SETTINGS_ERROR]", "PATCH /api/settings failed", { error: String(error) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
