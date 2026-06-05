import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildDownloadFilename } from "@/lib/files/safe-filename";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const { id } = await params;

    const message = await db.directMessage.findUnique({
      where: { id },
      select: {
        id: true,
        conversationId: true,
        mediaUrl: true,
        mediaPath: true,
        mediaName: true,
        mediaMimeType: true,
        mediaSize: true,
        type: true,
        isDeleted: true,
      },
    });

    if (!message || message.isDeleted) {
      return NextResponse.json({ error: "Message introuvable." }, { status: 404 });
    }

    const isMedia = message.type === "IMAGE" || message.type === "VIDEO" || message.type === "AUDIO";
    if (!isMedia) {
      return NextResponse.json({ error: "Ce message ne contient pas de média." }, { status: 404 });
    }

    // Verify participant
    const participant = await db.conversationParticipant.findFirst({
      where: { conversationId: message.conversationId, userId: session.user.id },
    });
    if (!participant) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    const supabase = createSupabaseServerClient();

    // Prefer mediaPath; fallback to extracting from mediaUrl if needed
    let path = message.mediaPath;
    if (!path && message.mediaUrl) {
      try {
        const url = new URL(message.mediaUrl);
        const segments = url.pathname.split("/");
        // Expected: /storage/v1/object/public/dm-media/conversations/...
        const bucketIndex = segments.findIndex((s) => s === "dm-media");
        if (bucketIndex !== -1) {
          path = segments.slice(bucketIndex + 1).join("/");
        }
      } catch {
        // ignore
      }
    }

    if (!path) {
      return NextResponse.json(
        { error: "Ce média utilise un ancien format et ne peut pas être téléchargé directement." },
        { status: 404 }
      );
    }

    const { data, error } = await supabase.storage.from("dm-media").download(path);
    if (error || !data) {
      console.error("[DM_DOWNLOAD] Supabase error:", error?.message);
      return NextResponse.json({ error: "Média indisponible." }, { status: 500 });
    }

    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fallbackType = message.type === "VIDEO" ? "video" : message.type === "AUDIO" ? "audio" : "image";
    const filename = buildDownloadFilename(message.mediaName, message.mediaMimeType, fallbackType);

    const contentType = message.mediaMimeType || "application/octet-stream";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[DM_DOWNLOAD] unexpected:", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
