import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { canViewPlan } from "@/lib/plans/permissions";
import QRCode from "qrcode";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    const allowed = await canViewPlan(user.id, id);
    if (!allowed) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const plan = await db.plan.findUnique({
      where: { id },
      select: { title: true, city: { select: { name: true } } },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan introuvable" }, { status: 404 });
    }

    const baseUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const planUrl = `${baseUrl}/plans/${id}`;

    const dataUrl = await QRCode.toDataURL(planUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    return NextResponse.json({
      qr: dataUrl,
      url: planUrl,
      title: plan.title,
      city: plan.city.name,
    });
  } catch (error) {
    console.error("QR code generation error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
