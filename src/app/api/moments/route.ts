import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { canViewPlan } from "@/lib/plans/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateMomentFile, buildMomentPath, ensureMomentsBucket, MOMENTS_BUCKET } from "@/lib/supabase/moments-storage";
import { MomentVisibility } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city");
    const type = searchParams.get("type"); // 'photo' | 'video'

    const friendRows = await db.friendship.findMany({
      where: { OR: [{ initiatorId: user.id }, { receiverId: user.id }] },
      select: { initiatorId: true, receiverId: true },
    });
    const friendIds = friendRows.map((f) =>
      f.initiatorId === user.id ? f.receiverId : f.initiatorId
    );

    const now = new Date();

    const baseWhere: Record<string, unknown> = {};
    if (city) baseWhere.city = city;
    if (type === "photo") baseWhere.type = "PHOTO";
    if (type === "video") baseWhere.type = "VIDEO";

    const moments = await db.moment.findMany({
      where: {
        ...baseWhere,
        AND: [
          {
            OR: [
              { visibility: "PUBLIC" },
              { authorId: user.id },
              { visibility: "FRIENDS", authorId: { in: friendIds } },
              { visibility: "PLAN_PARTICIPANTS", planId: { not: null } },
            ],
          },
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: now } },
            ],
          },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        author: { select: { id: true, name: true, username: true, image: true } },
      },
    });

    // Filter PLAN_PARTICIPANTS to only show if user is a participant
    const filtered = await Promise.all(
      moments.map(async (m) => {
        if (m.visibility === "PLAN_PARTICIPANTS" && m.planId) {
          const participant = await db.planParticipant.findUnique({
            where: { planId_userId: { planId: m.planId, userId: user.id } },
          });
          const plan = await db.plan.findUnique({ where: { id: m.planId }, select: { creatorId: true } });
          if (!participant && plan?.creatorId !== user.id) return null;
        }
        return m;
      })
    );

    return NextResponse.json({ moments: filtered.filter(Boolean) });
  } catch (error) {
    console.error("List moments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const caption = (formData.get("caption") as string | null)?.trim() || null;
    const visibility = (formData.get("visibility") as string) || "PUBLIC";
    const city = (formData.get("city") as string | null) || null;
    const countryCode = (formData.get("countryCode") as string | null) || null;
    const planId = (formData.get("planId") as string | null) || null;
    const placeId = (formData.get("placeId") as string | null) || null;
    const eventId = (formData.get("eventId") as string | null) || null;
    const liveId = (formData.get("liveId") as string | null) || null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
    }

    const validation = validateMomentFile(file);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Require at least one context
    if (!city && !planId && !placeId && !eventId && !liveId) {
      return NextResponse.json(
        { error: "Un moment doit être lié à une sortie, un lieu ou une ville." },
        { status: 400 }
      );
    }

    // Validate plan visibility if linked
    if (planId) {
      const canView = await canViewPlan(user.id, planId);
      if (!canView) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    let supabase;
    try {
      supabase = createSupabaseServerClient();
    } catch {
      return NextResponse.json({ error: "Supabase Storage non configuré." }, { status: 500 });
    }

    await ensureMomentsBucket(supabase);

    const filePath = buildMomentPath(user.id, file.type);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(MOMENTS_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Moment upload error:", uploadError);
      return NextResponse.json({ error: "Impossible d'envoyer le fichier." }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from(MOMENTS_BUCKET).getPublicUrl(filePath);
    const mediaUrl = publicUrlData.publicUrl;

    const moment = await db.moment.create({
      data: {
        authorId: user.id,
        type: file.type.startsWith("video/") ? "VIDEO" : "PHOTO",
        mediaUrl,
        caption,
        visibility: visibility as MomentVisibility,
        city,
        countryCode,
        planId,
        placeId,
        eventId,
        liveId,
      },
      include: {
        author: { select: { id: true, name: true, username: true, image: true } },
      },
    });

    return NextResponse.json({ moment }, { status: 201 });
  } catch (error) {
    console.error("Create moment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
