import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validation/schemas";
import { isAtLeast18 } from "@/lib/age";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { isValidCountryCode, getCountryName } from "@/lib/countries";
import { normalizeUsername, validateUsername } from "@/lib/username";
import { evaluateFounderBadges } from "@/lib/badges";
import { linkNewUserToReferral } from "@/lib/referral";
import { sendEmail, welcomeHtml } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
    if (contentLength > 100000) {
      return NextResponse.json({ error: "Requête trop volumineuse." }, { status: 413 });
    }

    const ip = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
    const limit = await rateLimit(`register:${ip}`, 3, 3600000);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Trop de tentatives d'inscription. Veuillez réessayer plus tard." },
        { status: 429, headers: getRateLimitHeaders(limit) }
      );
    }

    const body = await req.json();
    const url = new URL(req.url);
    const referralCode =
      (typeof body.referralCode === "string" ? body.referralCode : null) ||
      url.searchParams.get("referralCode") ||
      url.searchParams.get("referral");

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
      return NextResponse.json(
        { error: "Le pays sélectionné est invalide." },
        { status: 400 }
      );
    }

    const countryName = getCountryName(countryCode) || "";

    const existingEmail = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (existingEmail) {
      return NextResponse.json({ error: "Vérifie tes informations et réessaie." }, { status: 409 });
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
      const newUser = await db.user.create({
        data: {
          name,
          username,
          email,
          password: hashedPassword,
          accountKind: "STANDARD",
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

      if (referralCode) {
        linkNewUserToReferral(referralCode, newUser.id).catch((err) => {
          if (process.env.NODE_ENV === "development") {
            console.error("[REGISTER] Referral linking error (non-blocking):", err);
          }
        });
      } else {
        evaluateFounderBadges(newUser.id).catch((err) => {
          if (process.env.NODE_ENV === "development") {
            console.error("[REGISTER] Badge evaluation error:", err);
          }
        });
      }

      if (newUser.email) {
        sendEmail({
          to: newUser.email,
          subject: "Bienvenue sur OUTSIDE ! 🎉",
          html: welcomeHtml(newUser.name || ""),
        }).catch((err) => {
          if (process.env.NODE_ENV === "development") {
            console.error("[REGISTER] Welcome email error:", err);
          }
        });
      }
    } catch (dbError: unknown) {
      const err = dbError as { code?: string; meta?: { target?: string[] } };
      if (err.code === "P2002") {
        const target = err.meta?.target?.[0] ?? "field";
        if (target === "email") {
          return NextResponse.json({ error: "Vérifie tes informations et réessaie." }, { status: 409 });
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
    console.error("[REGISTER] Unexpected error:", error);
    return NextResponse.json({ error: "Une erreur est survenue. Veuillez réessayer." }, { status: 500 });
  }
}
