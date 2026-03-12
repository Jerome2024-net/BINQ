import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "@/lib/api-auth";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function ensureBucket() {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === "boutiques");
  if (!exists) {
    await supabaseAdmin.storage.createBucket("boutiques", {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    });
  }
}

// POST /api/boutiques/upload — Upload logo ou banner
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null; // "logo" or "banner"
    const boutiqueId = formData.get("boutiqueId") as string | null;
    const oldUrl = formData.get("oldUrl") as string | null;

    if (!file || !type || !["logo", "banner"].includes(type)) {
      return NextResponse.json({ error: "Fichier et type (logo/banner) requis" }, { status: 400 });
    }

    await ensureBucket();

    // Delete old file if exists
    if (oldUrl) {
      const parts = oldUrl.split("/object/public/boutiques/");
      const oldPath = parts.length > 1 ? parts[1] : null;
      if (oldPath) {
        await supabaseAdmin.storage.from("boutiques").remove([oldPath]);
      }
    }

    // Upload
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${user.id}-${type}-${Date.now()}.${fileExt}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from("boutiques")
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("boutiques")
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // If boutiqueId is provided, update the boutique directly
    if (boutiqueId) {
      const column = type === "logo" ? "logo_url" : "banner_url";
      const { error: updateError } = await supabaseAdmin
        .from("boutiques")
        .update({ [column]: publicUrl })
        .eq("id", boutiqueId)
        .eq("user_id", user.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ url: publicUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
