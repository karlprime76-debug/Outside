import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

const ALLOWED_FIELDS = [
  "profileVisibility",
  "showCityOnProfile",
  "allowFriendRequests",
  "allowFollowers",
  "allowFriendSuggestions",
  "notificationFriendRequests",
  "notificationPlanInvites",
  "notificationCityLives",
  "notificationProEvents",
  "notificationMoments",
] as const;

export async function GET() {
  const perfLabel = "[PERF] GET /api/settings";
  if (process.env.NODE_ENV !== "production") console.time(perfLabel);

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

    if (process.env.NODE_ENV !== "production") console.timeEnd(perfLabel);
    return NextResponse.json({ settings });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.timeEnd(perfLabel);
    console.error("Settings GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const perfLabel = "[PERF] PATCH /api/settings";
  if (process.env.NODE_ENV !== "production") console.time(perfLabel);

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

    if (process.env.NODE_ENV !== "production") console.timeEnd(perfLabel);
    return NextResponse.json({ message: "Paramètres mis à jour.", settings });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.timeEnd(perfLabel);
    console.error("Settings PATCH error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
