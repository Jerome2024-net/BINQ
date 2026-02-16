import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Créer le bucket s'il n'existe pas
async function ensureBucket() {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === "avatars");
  if (!exists) {
    await supabaseAdmin.storage.createBucket("avatars", {
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
    const userId = formData.get("userId") as string | null;
    const oldAvatar = formData.get("oldAvatar") as string | null;

    if (!file || !userId) {
      return NextResponse.json({ error: "Fichier et userId requis" }, { status: 400 });
    }

    // S'assurer que le bucket existe
    await ensureBucket();

    // Supprimer l'ancien avatar
    if (oldAvatar) {
      const parts = oldAvatar.split("/object/public/avatars/");
      const oldPath = parts.length > 1 ? parts[1] : null;
      if (oldPath) {
        await supabaseAdmin.storage.from("avatars").remove([oldPath]);
      }
    }

    // Upload
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from("avatars")
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
      .from("avatars")
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Mettre à jour la colonne avatar dans profiles (service role bypass RLS)
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ avatar: publicUrl })
      .eq("id", userId);

    if (updateError) {
      console.error("Profile update error:", updateError);
    }

    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    console.error("Avatar upload error:", error);
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
  }
}
