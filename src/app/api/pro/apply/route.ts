import { NextResponse } from "next/server";
import { AccountKind } from "@prisma/client";
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

    const existing = await db.proAccount.findUnique({
      where: { userId: user.id },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Tu as déjà une demande pro en cours ou validée." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      businessName,
      businessType,
      requestedAccountKind,
      description,
      country,
      countryCode,
      city,
      addressLabel,
      phone,
      email: contactEmail,
      website,
      socialMedia,
      documentUrl,
      category,
      logoUrl,
    } = body;

    if (!businessName || typeof businessName !== "string" || businessName.trim().length < 2) {
      return NextResponse.json({ error: "Le nom de l'établissement est requis." }, { status: 400 });
    }

    const validAccountKinds = ["OFFICIAL_GUIDE", "OFFICIAL_CITY", "OFFICIAL_PARTNER", "VERIFIED_CREATOR", "PARTNER_VENUE"];
    const safeAccountKind = validAccountKinds.includes(requestedAccountKind) ? requestedAccountKind : "VERIFIED_CREATOR";

    const validBusinessTypes = ["ORGANIZER", "VENUE", "BRAND", "RESTAURANT_BAR", "EVENT_AGENCY", "PROMOTER", "ARTIST_TEAM", "OTHER"];
    const safeBusinessType = validBusinessTypes.includes(businessType) ? businessType : "OTHER";

    const pro = await db.proAccount.create({
      data: {
        userId: user.id,
        businessName: businessName.trim(),
        businessType: safeBusinessType,
        requestedAccountKind: safeAccountKind as AccountKind,
        description: description?.trim() || null,
        country: country?.trim() || null,
        countryCode: countryCode?.trim() || null,
        city: city?.trim() || null,
        addressLabel: addressLabel?.trim() || null,
        phone: phone?.trim() || null,
        email: contactEmail?.trim() || null,
        website: website?.trim() || null,
        logoUrl: logoUrl?.trim() || null,
        socialMedia: socialMedia && typeof socialMedia === "object" ? socialMedia : null,
        documentUrl: documentUrl?.trim() || null,
        category: category?.trim() || null,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      { proAccount: pro, message: "Demande pro envoyée. L'équipe OUTSIDE va la vérifier." },
      { status: 201 }
    );
    } catch (error) {
      console.error("[PRO_APPLY]", error);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
  }