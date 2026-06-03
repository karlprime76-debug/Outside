import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validation/schemas";
import { isAtLeast18 } from "@/lib/age";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { isValidCountryCode, getCountryName } from "@/lib/countries";
import { normalizeUsername, validateUsername } from "@/lib/username";

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

    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log("[REGISTER] body keys:", Object.keys(body));
      // eslint-disable-next-line no-console
      console.log("[REGISTER] payload:", {
        name: body.name,
        username: body.username,
        email: body.email,
        countryCode: body.countryCode,
        homeCity: body.homeCity,
        hasPassword: Boolean(body.password),
        hasConfirmPassword: Boolean(body.confirmPassword),
        passwordLength: body.password?.length,
        homeCityLat: body.homeCityLat,
        homeCityLng: body.homeCityLng,
      });
    }

    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const field = firstIssue.path[0] ?? "field";

      const messages: Record<string, string> = {
        name: "Le nom est obligatoire (minimum 2 caractères).",
        username: "Le nom d'utilisateur est obligatoire (minimum 3 caractères, lettres/chiffres/_ uniquement).",
        email: "L'adresse email est invalide.",
        password: "Le mot de passe doit contenir au moins 8 caractères.",
        confirmPassword: "Les mots de passe ne correspondent pas.",
        countryCode: "Sélectionne ton pays.",
        homeCity: "Indique ta ville principale (minimum 2 caractères).",
        homeCityLat: "Coordonnées de ville invalides.",
        homeCityLng: "Coordonnées de ville invalides.",
      };

      const preciseError = messages[field] || firstIssue.message || "Veuillez vérifier les informations saisies.";

      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log("[REGISTER] Validation failed:", field, firstIssue.message);
      }

      return NextResponse.json(
        { error: preciseError },
        { status: 400 }
      );
    }

    const { name, username: rawUsername, email, password, gender, countryCode, homeCity, homeCityLat, homeCityLng, birthDate, acceptTerms } = parsed.data as typeof parsed.data & { birthDate: string; acceptTerms: boolean };

    // Validation âge et acceptation
    if (!birthDate) {
      return NextResponse.json({ error: "La date de naissance est requise." }, { status: 400 });
    }
    const bd = new Date(birthDate);
    if (!isAtLeast18(bd)) {
      return NextResponse.json({ message: "Tu dois avoir au moins 18 ans pour créer un compte OUTSIDE.", code: "AGE_RESTRICTED" }, { status: 403 });
    }
    if (!acceptTerms) {
      return NextResponse.json({ error: "Tu dois accepter les Conditions d’utilisation et la Politique de confidentialité." }, { status: 400 });
    }

    if (!isValidCountryCode(countryCode)) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log("[REGISTER] Validation failed: invalid_country_code", countryCode);
      }
      return NextResponse.json(
        { error: "Le pays sélectionné est invalide." },
        { status: 400 }
      );
    }

    const countryName = getCountryName(countryCode) || "";

    const existingEmail = await db.user.findUnique({ where: { email } });
    if (existingEmail) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log("[REGISTER] Validation failed: email_already_exists", email);
      }
      return NextResponse.json({ error: "Un compte existe déjà avec cet email." }, { status: 409 });
    }

    let username: string | null = null;
    if (rawUsername) {
      const norm = normalizeUsername(rawUsername);
      const valid = validateUsername(norm);
      if (!valid.ok) {
        return NextResponse.json({ error: valid.error }, { status: 400 });
      }
      const existingUsername = await db.user.findUnique({ where: { username: norm } });
      if (existingUsername) {
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.log("[REGISTER] Validation failed: username_already_taken", norm);
        }
        return NextResponse.json({ error: "Ce nom d'utilisateur est déjà utilisé." }, { status: 409 });
      }
      username = norm;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const cityName = homeCity.trim();

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

    try {
      await db.user.create({
        data: {
          name,
          username,
          email,
          password: hashedPassword,
          gender: gender || "PREFER_NOT_TO_SAY",
          country: countryName,
          countryCode: countryCode.toUpperCase(),
          homeCityId: city.id,
          activeCityId: city.id,
          birthDate: bd,
          isAdultConfirmed: true,
          termsAcceptedAt: new Date(),
          privacyAcceptedAt: new Date(),
        },
        select: { id: true, name: true, email: true },
      });
    } catch (dbError: unknown) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log("[REGISTER] Prisma error:", dbError);
      }

      const err = dbError as { code?: string; meta?: { target?: string[] } };
      if (err.code === "P2002") {
        const target = err.meta?.target?.[0] ?? "field";
        if (target === "email") {
          return NextResponse.json({ error: "Un compte existe déjà avec cet email." }, { status: 409 });
        }
        if (target === "username") {
          return NextResponse.json({ error: "Ce nom d'utilisateur est déjà utilisé." }, { status: 409 });
        }
        return NextResponse.json({ error: "Cette information est déjà utilisée." }, { status: 409 });
      }
      throw dbError;
    }

    return NextResponse.json({ message: "Compte créé avec succès." }, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("[REGISTER] Unexpected error:", error);
    }
    return NextResponse.json({ error: "Une erreur est survenue. Veuillez réessayer." }, { status: 500 });
  }
}
