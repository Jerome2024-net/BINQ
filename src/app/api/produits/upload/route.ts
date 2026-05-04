import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

async function ensureBucket() {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  const exists = buckets?.some((b: any) => b.name === "produits");
  if (!exists) {
    await supabaseAdmin.storage.createBucket("produits", {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    });
  }
}

// POST /api/produits/upload — Upload image produit
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const produitId = formData.get("produitId") as string | null;
    const oldUrl = formData.get("oldUrl") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
    }

    await ensureBucket();

    // Delete old file if exists
    if (oldUrl) {
      const parts = oldUrl.split("/object/public/produits/");
      const oldPath = parts.length > 1 ? parts[1] : null;
      if (oldPath) {
        await supabaseAdmin.storage.from("produits").remove([oldPath]);
      }
    }

    // Upload
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from("produits")
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("produits")
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // If produitId is provided, update the product directly
    if (produitId) {
      // Verify ownership: user must own the boutique that owns this product
      const { data: produit } = await supabaseAdmin
        .from("produits")
        .select("id, boutique_id, boutiques!inner(user_id)")
        .eq("id", produitId)
        .single();

      if (produit && (produit as any).boutiques?.user_id === user.id) {
        await supabaseAdmin
          .from("produits")
          .update({ image_url: publicUrl })
          .eq("id", produitId);
      }
    }

    return NextResponse.json({ url: publicUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
