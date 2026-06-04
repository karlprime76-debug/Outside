import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(req: Request) {
  const perfLabel = "[PERF] GET /api/places";
  if (process.env.NODE_ENV !== "production") console.time(perfLabel);

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cityId = searchParams.get("cityId");
    const category = searchParams.get("category");
    let limit = parseInt(searchParams.get("limit") || "50", 10);
    if (isNaN(limit) || limit < 1) limit = 50;
    if (limit > 50) limit = 50;

    const where: Record<string, unknown> = { isVisible: true };
    if (cityId) where.cityId = cityId;
    if (category) where.category = category;

    const places = await db.place.findMany({
      where,
      orderBy: { popularityScore: "desc" },
      take: limit,
      include: { city: { select: { name: true } } },
    });

    if (process.env.NODE_ENV !== "production") console.timeEnd(perfLabel);
    return NextResponse.json({ places });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.timeEnd(perfLabel);
    console.error("List places error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await req.json();

    const place = await db.place.create({
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
        cityId: body.cityId,
        neighborhood: body.neighborhood,
        address: body.address,
        latitude: body.latitude,
        longitude: body.longitude,
        priceLevel: body.priceLevel,
        openingHours: body.openingHours,
        images: body.images || [],
        isPartner: body.isPartner || false,
        safetyLevel: body.safetyLevel || "MEDIUM",
      },
      include: { city: { select: { name: true } } },
    });

    return NextResponse.json({ place }, { status: 201 });
  } catch (error) {
    console.error("Create place error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
