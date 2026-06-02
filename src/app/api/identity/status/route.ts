import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tu dois être connecté." }, { status: 401 });
    }

    return NextResponse.json({
      status: user.identityVerificationStatus,
    });
  } catch (error) {
    console.error("Identity status error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
