import { NextResponse } from "next/server";
import { getVapidPublicKey } from "@/lib/push";

export async function GET() {
  try {
    const key = getVapidPublicKey();
    if (!key) {
      return NextResponse.json({ error: "VAPID non configuré." }, { status: 500 });
    }
    return NextResponse.json({ publicKey: key });
  } catch (error) {
    console.error("[PUSH_KEY]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
