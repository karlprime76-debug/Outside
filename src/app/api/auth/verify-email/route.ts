import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = (body.token || "").toString().trim();

    if (!token) {
      return NextResponse.json({ error: "Token requis." }, { status: 400 });
    }

    const verification = await db.verificationToken.findUnique({
      where: { identifier_token: { identifier: "email-verify", token } },
    });

    if (!verification || verification.expires < new Date()) {
      return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: verification.identifier },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    await db.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    await db.verificationToken.delete({
      where: { identifier_token: { identifier: "email-verify", token } },
    });

    return NextResponse.json({ message: "Email vérifié avec succès." });
  } catch (error) {
    console.error("[VERIFY_EMAIL]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function PUT() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: "Email déjà vérifié." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.verificationToken.create({
      data: { identifier: "email-verify", token, expires },
    });

    // In production, send verification email
    // await sendEmail({ to: user.email, template: "email-verify", data: { token } });
    if (process.env.NODE_ENV === "development") {
      console.log("[VERIFY_EMAIL] Verification email generated"); // email omitted in logs
    }

    return NextResponse.json({ message: "Email de vérification envoyé." });
  } catch (error) {
    console.error("[VERIFY_EMAIL]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
