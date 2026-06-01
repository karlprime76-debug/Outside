import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { findNearestCity } from "@/lib/geo";

export async function GET() {
  try {
    const cities = await db.city.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ cities });
  } catch (error) {
    console.error("Cities error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { latitude, longitude } = await req.json();

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    const result = await findNearestCity({ latitude, longitude });

    return NextResponse.json(result);
  } catch (error) {
    console.error("City detect error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
