import { NextRequest, NextResponse } from "next/server";
import { calculerScore, verifierEligibilite } from "@/lib/contraintes";

export async function POST(request: NextRequest) {
  try {
    const { userId, action } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId requis" }, { status: 400 });
    }

    if (action === "eligibilite") {
      const result = await verifierEligibilite(userId);
      return NextResponse.json(result);
    }

    const score = await calculerScore(userId);
    return NextResponse.json(score);
  } catch (err) {
    console.error("Erreur score:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
