import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Tu dois être connecté." }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé." }, { status: 404 });
    }

    const body = await req.json();
    const {
      name,
      category,
      description,
      country,
      countryCode,
      city,
      area,
      addressPublic,
      phone,
      email: contactEmail,
      instagram,
      tiktok,
      logoUrl,
      documentUrl,
    } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Le nom du lieu est requis." }, { status: 400 });
    }

    const existing = await db.proVenue.findFirst({
      where: { ownerId: user.id, status: { in: ["PENDING", "APPROVED"] } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Tu as déjà une demande de lieu en cours ou validée." },
        { status: 400 }
      );
    }

    const venue = await db.proVenue.create({
      data: {
        ownerId: user.id,
        name: name.trim(),
        category: category?.trim() || null,
        description: description?.trim() || null,
        country: country?.trim() || null,
        countryCode: countryCode?.trim() || null,
        city: city?.trim() || null,
        area: area?.trim() || null,
        addressPublic: addressPublic?.trim() || null,
        phone: phone?.trim() || null,
        email: contactEmail?.trim() || null,
        instagram: instagram?.trim() || null,
        tiktok: tiktok?.trim() || null,
        logoUrl: logoUrl?.trim() || null,
        documentUrl: documentUrl?.trim() || null,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      { venue, message: "Demande envoyée. L'équipe OUTSIDE va vérifier ton lieu." },
      { status: 201 }
    );
    } catch (error) {
      console.error("[PRO_VENUE_APPLY]", error);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
  }