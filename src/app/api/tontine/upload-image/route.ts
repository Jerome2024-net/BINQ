import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET_NAME = "tontine-images";

// Créer le bucket s'il n'existe pas
async function ensureBucket() {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET_NAME);
  if (!exists) {
    await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const tontineId = formData.get("tontineId") as string | null;
    const oldImage = formData.get("oldImage") as string | null;

    if (!file || !tontineId) {
      return NextResponse.json({ error: "Fichier et tontineId requis" }, { status: 400 });
    }

    // S'assurer que le bucket existe
    await ensureBucket();

    // Supprimer l'ancienne image
    if (oldImage) {
      const parts = oldImage.split(`/object/public/${BUCKET_NAME}/`);
      const oldPath = parts.length > 1 ? parts[1] : null;
      if (oldPath) {
        await supabaseAdmin.storage.from(BUCKET_NAME).remove([oldPath]);
      }
    }

    // Upload
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${tontineId}-${Date.now()}.${fileExt}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // URL publique
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Mettre à jour la colonne image dans tontines
    const { error: updateError } = await supabaseAdmin
      .from("tontines")
      .update({ image: publicUrl })
      .eq("id", tontineId);

    if (updateError) {
      console.error("Tontine image update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ url: publicUrl });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    console.error("Tontine image upload error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
