import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { isValidCountryCode, getCountryName } from "@/lib/countries";

const profileUpdateSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(80, "Le nom est trop long").optional(),
  username: z.string().min(3, "Le username doit contenir au moins 3 caractères").max(30, "Le username est trop long").regex(/^[a-zA-Z0-9_]+$/, "Lettres, chiffres et underscore uniquement").optional(),
  bio: z.string().max(160, "La bio est trop longue").optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(),
  countryCode: z.string().length(2, "Code pays invalide").optional(),
  homeCity: z.string().min(2, "La ville doit contenir au moins 2 caractères").max(120, "La ville est trop longue").optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Tu dois être connecté." }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { homeCity: true, activeCity: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      image: user.image,
      bio: user.bio,
      gender: user.gender,
      country: user.country,
      countryCode: user.countryCode,
      homeCity: user.homeCity?.name || null,
      activeCity: user.activeCity?.name || null,
      neighborhood: user.neighborhood,
      language: user.language,
      preferredBudget: user.preferredBudget,
      isVerified: user.isVerified,
    });
  } catch {
    return NextResponse.json({ error: "Impossible de charger le profil." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Tu dois être connecté." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = profileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstIssue.message || "Veuillez vérifier les informations saisies." },
        { status: 400 }
      );
    }

    const { name, username, bio, gender, countryCode, homeCity } = parsed.data;

    const existingUser = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
    }

    if (username && username !== existingUser.username) {
      const taken = await db.user.findUnique({ where: { username } });
      if (taken) {
        return NextResponse.json({ error: "Ce nom d'utilisateur est déjà utilisé." }, { status: 409 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (gender !== undefined) updateData.gender = gender;

    if (countryCode !== undefined) {
      if (!isValidCountryCode(countryCode)) {
        return NextResponse.json({ error: "Code pays invalide." }, { status: 400 });
      }
      updateData.countryCode = countryCode.toUpperCase();
      updateData.country = getCountryName(countryCode) || "";
    }

    if (homeCity !== undefined) {
      const countryName = countryCode
        ? getCountryName(countryCode) || existingUser.country || ""
        : existingUser.country || "";
      const countryCodeValue = countryCode
        ? countryCode.toUpperCase()
        : existingUser.countryCode || "";

      let city = await db.city.findUnique({
        where: { name_country: { name: homeCity.trim(), country: countryName } },
      });

      if (!city) {
        city = await db.city.create({
          data: {
            name: homeCity.trim(),
            country: countryName,
            countryCode: countryCodeValue,
            latitude: 0,
            longitude: 0,
            currency: "",
            timezone: "",
          },
        });
      }

      updateData.homeCityId = city.id;
      updateData.activeCityId = city.id;
    }

    const updated = await db.user.update({
      where: { email: session.user.email },
      data: updateData,
      include: { homeCity: true, activeCity: true },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      username: updated.username,
      email: updated.email,
      image: updated.image,
      bio: updated.bio,
      gender: updated.gender,
      country: updated.country,
      countryCode: updated.countryCode,
      homeCity: updated.homeCity?.name || null,
      activeCity: updated.activeCity?.name || null,
      message: "Profil mis à jour.",
    });
  } catch {
    return NextResponse.json({ error: "Impossible de mettre à jour le profil." }, { status: 500 });
  }
}
