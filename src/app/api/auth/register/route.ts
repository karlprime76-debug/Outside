import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validation/schemas";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { isValidCountryCode, getCountryName } from "@/lib/countries";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "anonymous";
    const limit = rateLimit(`register:${ip}`, 3, 3600000);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Trop de tentatives d'inscription. Veuillez réessayer plus tard." },
        { status: 429, headers: getRateLimitHeaders(limit) }
      );
    }

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Veuillez vérifier les informations saisies." },
        { status: 400 }
      );
    }

    const { name, username, email, password, countryCode, country, homeCity, homeCityLat, homeCityLng } = parsed.data;

    if (!isValidCountryCode(countryCode)) {
      return NextResponse.json(
        { error: "Code pays invalide." },
        { status: 400 }
      );
    }

    const existingEmail = await db.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({ error: "Un compte existe déjà avec cet email." }, { status: 409 });
    }

    if (username) {
      const existingUsername = await db.user.findUnique({ where: { username } });
      if (existingUsername) {
        return NextResponse.json({ error: "Ce nom d'utilisateur est déjà pris." }, { status: 409 });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Find or create the city
    const cityName = homeCity.trim();
    const countryName = country || getCountryName(countryCode) || "";

    let city = await db.city.findUnique({
      where: { name_country: { name: cityName, country: countryName } },
    });

    if (!city) {
      city = await db.city.create({
        data: {
          name: cityName,
          country: countryName,
          countryCode: countryCode.toUpperCase(),
          latitude: homeCityLat ?? 0,
          longitude: homeCityLng ?? 0,
          currency: "",
          timezone: "",
        },
      });
    }

    await db.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        country: countryName,
        countryCode: countryCode.toUpperCase(),
        homeCityId: city.id,
        activeCityId: city.id,
      },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({ message: "Compte créé avec succès." }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Une erreur est survenue. Veuillez réessayer." }, { status: 500 });
  }
}
