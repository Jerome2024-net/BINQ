import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "@/lib/api-auth";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function ensureBucket() {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  const bucket = buckets?.find((b) => b.name === "events");
  if (!bucket) {
    await supabaseAdmin.storage.createBucket("events", {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
    });
  } else if (!bucket.public) {
    // Force le bucket en public si il existe déjà en privé
    await supabaseAdmin.storage.updateBucket("events", {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
    });
  }
}

// POST /api/events/upload — Upload logo ou cover d'un événement
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const event_id = formData.get("event_id") as string;
    const type = (formData.get("type") as string) || "cover"; // "cover" or "logo"

    if (!file || !event_id) {
      return NextResponse.json({ error: "Fichier et event_id requis" }, { status: 400 });
    }

    if (type !== "cover" && type !== "logo") {
      return NextResponse.json({ error: "Type doit être cover ou logo" }, { status: 400 });
    }

    // Vérifier que l'événement existe (sans filtrer par user_id pour éviter les problèmes d'auth)
    const { data: event, error: fetchError } = await supabaseAdmin
      .from("events")
      .select("id, user_id")
      .eq("id", event_id)
      .single();

    if (fetchError || !event) {
      console.error("Event lookup failed:", { event_id, fetchError });
      return NextResponse.json({ error: "Événement non trouvé" }, { status: 404 });
    }

    // Vérifier la propriété
    if (event.user_id !== user.id) {
      console.error("User mismatch:", { eventUser: event.user_id, authUser: user.id });
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    await ensureBucket();

    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${event_id}/${type}_${Date.now()}.${ext}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("events")
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`Upload échoué: ${uploadError.message}`);
    }

    const { data: urlData } = supabaseAdmin.storage.from("events").getPublicUrl(fileName);

    // Mettre à jour l'événement
    const updateField = type === "logo" ? "logo_url" : "cover_url";
    const { error: updateError } = await supabaseAdmin
      .from("events")
      .update({ [updateField]: urlData.publicUrl, updated_at: new Date().toISOString() })
      .eq("id", event_id);

    if (updateError) {
      console.error("DB update error for event image:", updateError);
      throw new Error(`Erreur de mise à jour: ${updateError.message}`);
    }

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
