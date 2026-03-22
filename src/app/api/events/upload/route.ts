import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "@/lib/api-auth";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// POST /api/events/upload — Upload cover image d'un événement
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const supabase = getServiceClient();
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const event_id = formData.get("event_id") as string;

    if (!file || !event_id) {
      return NextResponse.json({ error: "Fichier et event_id requis" }, { status: 400 });
    }

    // Vérifier propriété
    const { data: event } = await supabase
      .from("events")
      .select("id, user_id")
      .eq("id", event_id)
      .eq("user_id", user.id)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Événement non trouvé" }, { status: 404 });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `events/${event_id}/cover_${Date.now()}.${ext}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from("images").getPublicUrl(fileName);

    // Mettre à jour l'événement
    await supabase
      .from("events")
      .update({ cover_url: urlData.publicUrl, updated_at: new Date().toISOString() })
      .eq("id", event_id);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
