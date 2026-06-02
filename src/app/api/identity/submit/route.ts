import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  validateIdentityFile,
  buildIdentityPath,
  IDENTITY_BUCKET,
} from "@/lib/supabase/identity-storage";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tu dois être connecté." }, { status: 401 });
    }

    const formData = await req.formData();
    const fullName = (formData.get("fullName") as string | null)?.trim();
    const documentType = (formData.get("documentType") as string | null)?.trim();
    const documentFile = formData.get("document") as File | null;
    const selfieFile = formData.get("selfie") as File | null;

    if (!fullName || !documentType) {
      return NextResponse.json(
        { error: "Nom complet et type de document requis." },
        { status: 400 }
      );
    }

    let supabase;
    try {
      supabase = createSupabaseServerClient();
    } catch {
      return NextResponse.json({ error: "Supabase Storage non configuré." }, { status: 500 });
    }

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === IDENTITY_BUCKET);
    if (!exists) {
      await supabase.storage.createBucket(IDENTITY_BUCKET, { public: false });
    }

    let documentPath: string | undefined;
    let selfiePath: string | undefined;

    if (documentFile) {
      const validation = validateIdentityFile(documentFile);
      if (!validation.ok) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
      documentPath = buildIdentityPath(user.id, documentFile.type, "document");
      const arrayBuffer = await documentFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const { error: uploadError } = await supabase.storage
        .from(IDENTITY_BUCKET)
        .upload(documentPath, buffer, { contentType: documentFile.type, upsert: false });
      if (uploadError) {
        console.error("Identity upload error:", uploadError);
        return NextResponse.json({ error: "Impossible d'envoyer le document." }, { status: 500 });
      }
    }

    if (selfieFile) {
      const validation = validateIdentityFile(selfieFile);
      if (!validation.ok) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
      selfiePath = buildIdentityPath(user.id, selfieFile.type, "selfie");
      const arrayBuffer = await selfieFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const { error: uploadError } = await supabase.storage
        .from(IDENTITY_BUCKET)
        .upload(selfiePath, buffer, { contentType: selfieFile.type, upsert: false });
      if (uploadError) {
        console.error("Selfie upload error:", uploadError);
        return NextResponse.json({ error: "Impossible d'envoyer le selfie." }, { status: 500 });
      }
    }

    await db.identityVerification.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        status: "PENDING",
        fullName,
        documentType,
        documentPath,
        selfiePath,
      },
      update: {
        status: "PENDING",
        fullName,
        documentType,
        documentPath: documentPath ?? undefined,
        selfiePath: selfiePath ?? undefined,
        reviewedAt: null,
        reviewedById: null,
        rejectionReason: null,
      },
    });

    await db.user.update({
      where: { id: user.id },
      data: { identityVerificationStatus: "PENDING" },
    });

    return NextResponse.json({ message: "Demande de vérification envoyée." });
  } catch (error) {
    console.error("Identity submit error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
