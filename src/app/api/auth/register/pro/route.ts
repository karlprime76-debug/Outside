import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { isValidCountryCode, getCountryName } from "@/lib/countries";
import { logError } from "@/lib/log";

const VALID_ACCOUNT_KINDS = ["OFFICIAL_GUIDE", "OFFICIAL_CITY", "OFFICIAL_PARTNER", "VERIFIED_CREATOR", "PARTNER_VENUE"];

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
    const {
      name,
      email,
      password,
      confirmPassword,
      requestedAccountKind,
      businessName,
      countryCode,
      city,
      phone,
      description,
      instagram,
      tiktok,
      website,
      verificationMessage,
      documentUrl,
    } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Le nom complet est obligatoire (minimum 2 caractères)." }, { status: 400 });
    }
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "L'adresse email est invalide." }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caractères." }, { status: 400 });
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Les mots de passe ne correspondent pas." }, { status: 400 });
    }
    if (!requestedAccountKind || !VALID_ACCOUNT_KINDS.includes(requestedAccountKind)) {
      return NextResponse.json({ error: "Le type de compte pro est requis." }, { status: 400 });
    }
    if (!businessName || typeof businessName !== "string" || businessName.trim().length < 2) {
      return NextResponse.json({ error: "Le nom de l'organisation est requis." }, { status: 400 });
    }

    const existingEmail = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (existingEmail) {
      return NextResponse.json({ error: "Cet email est déjà utilisé." }, { status: 409 });
    }

    const countryName = countryCode && isValidCountryCode(countryCode) ? getCountryName(countryCode) || "" : "";
    const hashedPassword = await bcrypt.hash(password, 12);

    const socialMedia: Record<string, string> = {};
    if (instagram) socialMedia.instagram = instagram;
    if (tiktok) socialMedia.tiktok = tiktok;
    if (website) socialMedia.website = website;
    if (verificationMessage) socialMedia.verificationMessage = verificationMessage;

    const user = await db.user.create({
      data: {
        name: name.trim(),
        email,
        password: hashedPassword,
        accountKind: "STANDARD",
        country: countryName || null,
        countryCode: countryCode?.toUpperCase() || null,
      },
    });

    await db.proAccount.create({
      data: {
        userId: user.id,
        businessName: businessName.trim(),
        businessType: "OTHER",
        requestedAccountKind,
        description: description?.trim() || null,
        country: countryName || null,
        countryCode: countryCode?.toUpperCase() || null,
        city: city?.trim() || null,
        phone: phone?.trim() || null,
        email: email,
        website: website?.trim() || null,
        socialMedia: Object.keys(socialMedia).length > 0 ? socialMedia : undefined,
        documentUrl: documentUrl?.trim() || null,
        status: "PENDING",
      },
    });

    logError("[REGISTER_PRO]", `Pro account request created for ${email}, kind: ${requestedAccountKind}`);

    return NextResponse.json(
      { message: "Ta demande pro a bien été envoyée. L'équipe OUTSIDE va la vérifier." },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER_PRO]", error);
    return NextResponse.json({ error: "Une erreur est survenue. Veuillez réessayer." }, { status: 500 });
  }
}
