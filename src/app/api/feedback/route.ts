import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";

const FEEDBACK_FILE = path.join(process.cwd(), "feedback.json");

interface FeedbackEntry {
  id: string;
  userId: string | null;
  userName: string;
  type: string;
  message: string;
  createdAt: string;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Tu dois être connecté." }, { status: 401 });
    }

    const body = await req.json();
    if (!body.message || typeof body.message !== "string" || body.message.length < 10) {
      return NextResponse.json({ error: "Minimum 10 caractères." }, { status: 400 });
    }
    if (body.message.length > 2000) {
      return NextResponse.json({ error: "Maximum 2000 caractères." }, { status: 400 });
    }

    const type = ["suggestion", "bug", "other"].includes(body.type) ? body.type : "other";

    const entry: FeedbackEntry = {
      id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId: session.user.id,
      userName: session.user.name || session.user.username || "Anonyme",
      type,
      message: body.message.trim(),
      createdAt: new Date().toISOString(),
    };

    let entries: FeedbackEntry[] = [];
    try {
      const raw = await fs.readFile(FEEDBACK_FILE, "utf-8");
      entries = JSON.parse(raw);
    } catch {
      entries = [];
    }
    entries.push(entry);
    await fs.writeFile(FEEDBACK_FILE, JSON.stringify(entries, null, 2), "utf-8");

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
