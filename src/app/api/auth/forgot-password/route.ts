import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = (body.email || "").toString().trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email requis." }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ message: "Si cet email existe, un lien de réinitialisation a été envoyé." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.passwordResetToken.create({
      data: { email, token, expiresAt },
    });

    // In production, send email with reset link
    // await sendEmail({ to: email, template: "password-reset", data: { token } });
    if (process.env.NODE_ENV === "development") {
      console.log("[RESET_PASSWORD] Reset token for", email, ":", token);
    }

    return NextResponse.json({ message: "Si cet email existe, un lien de réinitialisation a été envoyé." });
  } catch (error) {
    console.error("[FORGOT_PASSWORD]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
