import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function ensureBucket(supabase: ReturnType<typeof getServiceClient>) {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === "cagnottes");
  if (!exists) {
    await supabase.storage.createBucket("cagnottes", {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    });
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const cagnotteId = formData.get("cagnotteId") as string | null;

    if (!file || !cagnotteId) {
      return NextResponse.json({ error: "Fichier et cagnotteId requis" }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Vérifier que l'utilisateur est admin de la cagnotte
    const { data: membre } = await supabase
      .from("cagnotte_membres")
      .select("role")
      .eq("cagnotte_id", cagnotteId)
      .eq("user_id", user.id)
      .single();

    if (!membre || membre.role !== "admin") {
      return NextResponse.json({ error: "Seul l'admin peut modifier l'image" }, { status: 403 });
    }

    await ensureBucket(supabase);

    // Supprimer l'ancienne image si elle existe
    const { data: cagnotte } = await supabase
      .from("cagnottes")
      .select("image_url")
      .eq("id", cagnotteId)
      .single();

    if (cagnotte?.image_url) {
      const parts = cagnotte.image_url.split("/object/public/cagnottes/");
      const oldPath = parts.length > 1 ? parts[1] : null;
      if (oldPath) {
        await supabase.storage.from("cagnottes").remove([oldPath]);
      }
    }

    // Upload
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${cagnotteId}-${Date.now()}.${fileExt}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("cagnottes")
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicData } = supabase.storage
      .from("cagnottes")
      .getPublicUrl(fileName);

    // Mettre à jour la cagnotte
    await supabase
      .from("cagnottes")
      .update({ image_url: publicData.publicUrl, updated_at: new Date().toISOString() })
      .eq("id", cagnotteId);

    return NextResponse.json({ url: publicData.publicUrl });
  } catch (err) {
    console.error("Upload image cagnotte:", err);
    return NextResponse.json({ error: "Erreur upload" }, { status: 500 });
  }
}
