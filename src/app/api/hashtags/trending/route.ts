import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface TrendingHashtag {
  tag: string;
  displayName: string | null;
  usageCount: number;
  trendingScore: number;
  city: string | null;
  countryCode: string | null;
  isOfficial: boolean;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const city = url.searchParams.get("city");
    const countryCode = url.searchParams.get("countryCode");
    const scope = (url.searchParams.get("scope") || "city") as "city" | "country" | "global";
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);

    const whereClause: Record<string, unknown> = {
      isBlocked: false,
    };

    // Scope-based filtering
    if (scope === "city" && city) {
      whereClause.city = city;
      whereClause.localTrendingScore = { gt: 0 };
    } else if (scope === "country" && countryCode) {
      whereClause.countryCode = countryCode;
      whereClause.trendingScore = { gt: 0 };
    } else if (scope === "global") {
      whereClause.city = null;
      whereClause.trendingScore = { gt: 0 };
    }

    // Fallback: if city scope but no city results, try country
    let hashtags = await db.hashtag.findMany({
      where: whereClause,
      orderBy: scope === "city" ? { localTrendingScore: "desc" } : { trendingScore: "desc" },
      take: limit,
    });

    // If no results for city scope, try country
    if (hashtags.length === 0 && scope === "city" && countryCode) {
      hashtags = await db.hashtag.findMany({
        where: {
          isBlocked: false,
          countryCode,
          trendingScore: { gt: 0 },
        },
        orderBy: { trendingScore: "desc" },
        take: limit,
      });
    }

    // Final fallback: global
    if (hashtags.length === 0) {
      hashtags = await db.hashtag.findMany({
        where: {
          isBlocked: false,
          city: null,
          trendingScore: { gt: 0 },
        },
        orderBy: { trendingScore: "desc" },
        take: limit,
      });
    }

    const trending: TrendingHashtag[] = hashtags.map((h) => ({
      tag: h.tag,
      displayName: h.displayName || `#${h.tag}`,
      usageCount: h.usageCount,
      trendingScore: h.trendingScore,
      localTrendingScore: h.localTrendingScore,
      city: h.city,
      countryCode: h.countryCode,
      isOfficial: h.isOfficial,
    }));

    return NextResponse.json({ 
      hashtags: trending,
      scope,
      city: city || null,
      countryCode: countryCode || null,
    });
  } catch (error) {
    console.error("[GET TRENDING HASHTAGS ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

