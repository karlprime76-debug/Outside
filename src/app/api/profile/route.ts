import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { normalizeUsername, validateUsername } from "@/lib/username";
import { isValidCountryCode, getCountryName } from "@/lib/countries";

const profileUpdateSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(80, "Le nom est trop long").optional(),
  username: z.string().min(3, "Le username doit contenir au moins 3 caractères").max(30, "Le username est trop long").optional(),
  bio: z.string().max(160, "La bio est trop longue").optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(),
  countryCode: z.string().length(2, "Code pays invalide").optional(),
  homeCity: z.string().min(2, "La ville doit contenir au moins 2 caractères").max(120, "La ville est trop longue").optional(),
  birthDate: z.string().optional(),
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
      birthDate: user.birthDate ? user.birthDate.toISOString() : null,
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

    const { name, username, bio, gender, countryCode, homeCity, birthDate } = parsed.data as { name?: string; username?: string; bio?: string; gender?: string; countryCode?: string; homeCity?: string; birthDate?: string };

    const existingUser = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;

    if (username && username !== existingUser.username) {
      const norm = normalizeUsername(username);
      const valid = validateUsername(norm);
      if (!valid.ok) {
        return NextResponse.json({ error: valid.error }, { status: 400 });
      }
      const taken = await db.user.findUnique({ where: { username: norm } });
      if (taken) {
        return NextResponse.json({ error: "Ce nom d'utilisateur est déjà utilisé." }, { status: 409 });
      }
      
      // Appliquer le username normalisé
      (updateData as Record<string, unknown>).username = norm;
    }

    // username déjà traité plus haut (normalisé/validé)
    if (bio !== undefined) updateData.bio = bio;
    if (gender !== undefined) updateData.gender = gender;

    // birthDate (complétion légale). On autorise uniquement si absente côté DB.
    if (birthDate !== undefined) {
      if (existingUser.birthDate) {
        // On ignore silencieusement si déjà défini pour éviter les downgrades.
      } else {
        const bd = new Date(birthDate);
        // Calcul exact pour >= 18 ans
        const today = new Date();
        let age = today.getFullYear() - bd.getFullYear();
        const m = today.getMonth() - bd.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
        if (isNaN(bd.getTime())) {
          return NextResponse.json({ error: "Date de naissance invalide." }, { status: 400 });
        }
        if (age < 18) {
          return NextResponse.json({ error: "Tu dois avoir au moins 18 ans pour utiliser OUTSIDE." }, { status: 403 });
        }
        updateData.birthDate = bd;
        updateData.isAdultConfirmed = true;
      }
    }

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
