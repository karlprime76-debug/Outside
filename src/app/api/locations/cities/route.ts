import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isValidCountryCode } from "@/lib/countries";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const countryCode = searchParams.get("countryCode")?.trim().toUpperCase();
    const q = searchParams.get("q")?.trim();
    const limitParam = searchParams.get("limit");
    const limit = Math.min(parseInt(limitParam || "20", 10), 50);

    if (!countryCode) {
      return NextResponse.json(
        { error: "Le code pays est requis." },
        { status: 400 }
      );
    }

    if (!isValidCountryCode(countryCode)) {
      return NextResponse.json(
        { error: "Code pays invalide." },
        { status: 400 }
      );
    }

    const cities = await db.city.findMany({
      where: {
        countryCode,
        ...(q
          ? {
              name: {
                contains: q,
                mode: "insensitive",
              },
            }
          : {}),
      },
      orderBy: { name: "asc" },
      take: limit,
      select: {
        id: true,
        name: true,
        countryCode: true,
        latitude: true,
        longitude: true,
      },
    });

    const formatted = cities.map((c) => ({
      id: c.id,
      name: c.name,
      countryCode: c.countryCode,
      lat: c.latitude,
      lng: c.longitude,
    }));

    return NextResponse.json({ cities: formatted });
  } catch (error) {
    console.error("Cities search error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue." },
      { status: 500 }
    );
  }
}
