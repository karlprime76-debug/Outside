import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  AVATARS_BUCKET,
  AVATAR_MAX_SIZE,
  ALLOWED_AVATAR_TYPES,
  buildAvatarPath,
  ensureAvatarsBucket,
} from "@/lib/supabase/storage";

export async function POST(req: Request) {
  try {
    console.log("[AVATAR_UPLOAD] start");

    const session = await auth();
    if (!session?.user?.email) {
      console.log("[AVATAR_UPLOAD] UNAUTHORIZED");
      return NextResponse.json(
        { message: "Tu dois être connecté.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      console.log("[AVATAR_UPLOAD] USER_NOT_FOUND");
      return NextResponse.json(
        { message: "Utilisateur non trouvé.", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }
    console.log("[AVATAR_UPLOAD] userId:", user.id);

    console.log("[AVATAR_UPLOAD] env:", {
      hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    });

    let supabase;
    try {
      supabase = createSupabaseServerClient();
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : "Erreur inconnue";
      console.error("[AVATAR_UPLOAD] Config error:", rawMessage);

      if (rawMessage.includes("NEXT_PUBLIC_SUPABASE_URL")) {
        return NextResponse.json(
          {
            message: "Supabase Storage n'est pas configuré. Variable manquante : NEXT_PUBLIC_SUPABASE_URL.",
            code: "MISSING_SUPABASE_URL",
          },
          { status: 500 }
        );
      }
      if (rawMessage.includes("SUPABASE_SERVICE_ROLE_KEY")) {
        return NextResponse.json(
          {
            message: "Supabase Storage n'est pas configuré. Variable manquante : SUPABASE_SERVICE_ROLE_KEY.",
            code: "MISSING_SERVICE_ROLE_KEY",
          },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { message: "Supabase Storage n'est pas configuré.", code: "STORAGE_CONFIG_ERROR" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      console.log("[AVATAR_UPLOAD] NO_FILE");
      return NextResponse.json(
        { message: "Aucune image reçue.", code: "NO_FILE" },
        { status: 400 }
      );
    }

    console.log("[AVATAR_UPLOAD] file:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      console.log("[AVATAR_UPLOAD] INVALID_FILE_TYPE:", file.type);
      return NextResponse.json(
        { message: "Format d'image non accepté. Utilise JPG, PNG ou WebP.", code: "INVALID_FILE_TYPE" },
        { status: 400 }
      );
    }

    if (file.size > AVATAR_MAX_SIZE) {
      console.log("[AVATAR_UPLOAD] FILE_TOO_LARGE:", file.size);
      return NextResponse.json(
        { message: "Cette image est trop lourde. Taille maximale : 5 Mo.", code: "FILE_TOO_LARGE" },
        { status: 400 }
      );
    }

    const filePath = buildAvatarPath(user.id, file.type);
    console.log("[AVATAR_UPLOAD] bucket:", AVATARS_BUCKET);
    console.log("[AVATAR_UPLOAD] path:", filePath);

    try {
      await ensureAvatarsBucket(supabase);
      console.log("[AVATAR_UPLOAD] bucket ensured");
    } catch (bucketErr) {
      const raw = bucketErr instanceof Error ? bucketErr.message : "Erreur inconnue";
      console.error("[AVATAR_UPLOAD] Bucket error:", raw);
      return NextResponse.json(
        {
          message: "Le bucket avatars n'existe pas et n'a pas pu être créé. Vérifie la connexion Supabase.",
          code: "BUCKET_NOT_FOUND",
        },
        { status: 500 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("[AVATAR_UPLOAD] Supabase upload error:", uploadError);

      const msg = (uploadError.message || "").toLowerCase();
      if (
        msg.includes("bucket") ||
        msg.includes("not found") ||
        msg.includes("does not exist") ||
        msg.includes("fetch failed") ||
        msg.includes("network")
      ) {
        return NextResponse.json(
          {
            message: "Le bucket avatars n'existe pas dans Supabase Storage. Crée-le dans le dashboard Supabase > Storage > New bucket.",
            code: "BUCKET_NOT_FOUND",
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          message: "Impossible d'envoyer la photo vers Supabase Storage.",
          code: "STORAGE_UPLOAD_FAILED",
        },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(filePath);
    const publicUrl = publicUrlData.publicUrl;
    console.log("[AVATAR_UPLOAD] publicUrl:", publicUrl);

    try {
      const updated = await db.user.update({
        where: { id: user.id },
        data: { image: publicUrl },
        include: { homeCity: true, activeCity: true },
      });

      console.log("[AVATAR_UPLOAD] success");
      return NextResponse.json({
        message: "Photo de profil mise à jour.",
        image: publicUrl,
        user: {
          id: updated.id,
          name: updated.name,
          username: updated.username,
          email: updated.email,
          image: updated.image,
          bio: updated.bio,
          country: updated.country,
          countryCode: updated.countryCode,
          homeCity: updated.homeCity?.name || null,
          activeCity: updated.activeCity?.name || null,
        },
        code: "SUCCESS",
      });
    } catch (prismaErr) {
      console.error("[AVATAR_UPLOAD] Prisma update error:", prismaErr);
      return NextResponse.json(
        {
          message: "La photo a été envoyée, mais le profil n'a pas pu être mis à jour.",
          code: "PRISMA_UPDATE_FAILED",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[AVATAR_UPLOAD] Unexpected error:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue. Veuillez réessayer.", code: "UNEXPECTED_ERROR" },
      { status: 500 }
    );
  }
}
