import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// GET /api/categories — Liste publique des catégories
export async function GET() {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("ordre", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ categories: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
