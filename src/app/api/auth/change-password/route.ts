import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { invalidateUserSessions } from "@/lib/auth/invalidate";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const currentPassword = (body.currentPassword || "").toString();
    const newPassword = (body.newPassword || "").toString();

    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: "Mot de passe invalide (min 8 caractères)." }, { status: 400 });
    }

    if (!user.password) {
      return NextResponse.json({ error: "Compte sans mot de passe." }, { status: 400 });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Mot de passe actuel incorrect." }, { status: 403 });
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { password: hashed },
      }),
    ]);

    await invalidateUserSessions(user.id);

    return NextResponse.json({ message: "Mot de passe modifié avec succès. Tu vas être déconnecté." });
  } catch (error) {
    console.error("[CHANGE_PASSWORD]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
