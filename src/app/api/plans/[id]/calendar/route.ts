import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { canViewPlan } from "@/lib/plans/permissions";

function toIcsDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

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
      select: {
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        city: { select: { name: true } },
        place: { select: { name: true } },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan introuvable" }, { status: 404 });
    }

    const dtstart = toIcsDate(plan.startDate);
    const dtend = plan.endDate
      ? toIcsDate(plan.endDate)
      : toIcsDate(new Date(plan.startDate.getTime() + 2 * 60 * 60 * 1000));

    const location = [plan.city?.name, plan.place?.name].filter(Boolean).join(", ");

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Outside//FR",
      "BEGIN:VEVENT",
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${plan.title}`,
      `DESCRIPTION:${plan.description || ""}`,
      `LOCATION:${location}`,
      `UID:${id}@outside`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const filename = `${plan.title.replace(/[^a-zA-Z0-9]/g, "_")}.ics`;

    return new Response(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[CALENDAR_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
