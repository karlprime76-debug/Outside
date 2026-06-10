import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { normalizeHashtag } from "@/lib/hashtags/hashtag-utils";

export async function POST(
  req: Request,
  context: { params: Promise<{ tag: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { tag } = await context.params;
    const normalizedTag = normalizeHashtag(tag);
    
    // Get city and countryCode from query params for local follows
    const url = new URL(req.url);
    const city = url.searchParams.get("city") || user.activeCity?.name || null;
    const countryCode = url.searchParams.get("countryCode") || user.countryCode || null;

    if (!normalizedTag) {
      return NextResponse.json({ error: "Hashtag invalide" }, { status: 400 });
    }

    // Check if hashtag exists
    const hashtag = await db.hashtag.findFirst({
      where: {
        tag: normalizedTag,
        OR: [
          { city: city || null },
          { city: null }, // Global hashtag fallback
        ],
      },
    });

    if (!hashtag) {
      return NextResponse.json({ error: "Hashtag non trouvé" }, { status: 404 });
    }

    if (hashtag.isBlocked) {
      return NextResponse.json({ error: "Hashtag bloqué" }, { status: 403 });
    }

    // Check if already following
    const existing = await db.userHashtagFollow.findUnique({
      where: {
        userId_hashtagId: {
          userId: user.id,
          hashtagId: hashtag.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Déjà suivi" }, { status: 400 });
    }

    // Create follow
    await db.userHashtagFollow.create({
      data: {
        userId: user.id,
        hashtagId: hashtag.id,
        city,
        countryCode,
      },
    });

    return NextResponse.json({ 
      success: true, 
      following: true,
      hashtag: {
        tag: hashtag.tag,
        displayName: hashtag.displayName || `#${hashtag.tag}`,
        isOfficial: hashtag.isOfficial,
      }
    });
  } catch (error) {
    console.error("[FOLLOW_HASHTAG_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ tag: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { tag } = await context.params;
    const normalizedTag = normalizeHashtag(tag);

    if (!normalizedTag) {
      return NextResponse.json({ error: "Hashtag invalide" }, { status: 400 });
    }

    // Find hashtag
    const hashtag = await db.hashtag.findFirst({
      where: { tag: normalizedTag },
    });

    if (!hashtag) {
      return NextResponse.json({ error: "Hashtag non trouvé" }, { status: 404 });
    }

    // Delete follow
    await db.userHashtagFollow.deleteMany({
      where: {
        userId: user.id,
        hashtagId: hashtag.id,
      },
    });

    return NextResponse.json({ 
      success: true, 
      following: false,
      hashtag: {
        tag: hashtag.tag,
        displayName: hashtag.displayName || `#${hashtag.tag}`,
        isOfficial: hashtag.isOfficial,
      }
    });
  } catch (error) {
    console.error("[UNFOLLOW_HASHTAG_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
