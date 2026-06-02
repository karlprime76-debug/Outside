import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
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

  const proAccount = await db.proAccount.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!proAccount) {
    return NextResponse.json({ error: "Aucun compte pro trouvé." }, { status: 403 });
  }

  const events = await db.proEvent.findMany({
    where: { proAccountId: proAccount.id },
    orderBy: { startsAt: "asc" },
  });

  return NextResponse.json({ events });
}

export async function POST(req: Request) {
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

  const proAccount = await db.proAccount.findUnique({
    where: { userId: user.id },
    select: { id: true, status: true },
  });

  if (!proAccount || proAccount.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Seuls les pros approuvés peuvent créer des événements." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const {
    title,
    description,
    category,
    city,
    country,
    countryCode,
    venueName,
    addressLabel,
    startsAt,
    endsAt,
    priceLabel,
    currency,
    ticketUrl,
    reservationUrl,
    visibility,
    status: eventStatus,
  } = body;

  if (!title || typeof title !== "string" || title.trim().length < 2) {
    return NextResponse.json({ error: "Le titre est requis." }, { status: 400 });
  }

  if (!startsAt) {
    return NextResponse.json({ error: "La date de début est requise." }, { status: 400 });
  }

  const startDate = new Date(startsAt);
  if (isNaN(startDate.getTime())) {
    return NextResponse.json({ error: "Date de début invalide." }, { status: 400 });
  }

  const event = await db.proEvent.create({
    data: {
      proAccountId: proAccount.id,
      title: title.trim(),
      description: description?.trim() || null,
      category: category?.trim() || null,
      city: city?.trim() || null,
      country: country?.trim() || null,
      countryCode: countryCode?.trim() || null,
      venueName: venueName?.trim() || null,
      addressLabel: addressLabel?.trim() || null,
      startsAt: startDate,
      endsAt: endsAt ? new Date(endsAt) : null,
      priceLabel: priceLabel?.trim() || null,
      currency: currency?.trim() || null,
      ticketUrl: ticketUrl?.trim() || null,
      reservationUrl: reservationUrl?.trim() || null,
      visibility: visibility || "PUBLIC",
      status: eventStatus === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
    },
  });

  return NextResponse.json(
    { event, message: "Événement créé." },
    { status: 201 }
  );
}
