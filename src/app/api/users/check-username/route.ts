import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizeUsername, validateUsername } from "@/lib/username";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const input = searchParams.get("username") || "";
    const normalized = normalizeUsername(input);

    const valid = validateUsername(normalized);
    if (!valid.ok) {
      return NextResponse.json({ available: false, normalized, reason: valid.error });
    }

    const existing = await db.user.findUnique({ where: { username: normalized } });
    if (existing) {
      return NextResponse.json({ available: false, normalized, reason: "Nom d’utilisateur déjà utilisé." });
    }

    return NextResponse.json({ available: true, normalized });
  } catch {
    return NextResponse.json({ available: false, reason: "Erreur serveur" }, { status: 500 });
  }
}
