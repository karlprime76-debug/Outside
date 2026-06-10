import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { invalidateUserSessions } from "@/lib/auth/invalidate";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = (body.token || "").toString().trim();
    const password = (body.password || "").toString();

    if (!token || !password || password.length < 8) {
      return NextResponse.json({ error: "Token invalide ou mot de passe trop court." }, { status: 400 });
    }

    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await db.user.findUnique({
      where: { email: resetToken.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      db.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    await invalidateUserSessions(user.id);

    return NextResponse.json({ message: "Mot de passe réinitialisé avec succès." });
  } catch (error) {
    console.error("[RESET_PASSWORD]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
