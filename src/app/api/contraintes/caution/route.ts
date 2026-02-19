import { NextRequest, NextResponse } from "next/server";
import { bloquerCaution, restituerCaution } from "@/lib/contraintes";

export async function POST(request: NextRequest) {
  try {
    const { action, userId, tontineId, montant } = await request.json();

    if (!userId || !tontineId) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    switch (action) {
      case "bloquer": {
        if (!montant || montant <= 0) {
          return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
        }
        const result = await bloquerCaution(userId, tontineId, montant);
        return NextResponse.json(result);
      }

      case "restituer": {
        const result = await restituerCaution(userId, tontineId);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ error: "Action invalide (bloquer | restituer)" }, { status: 400 });
    }
  } catch (err) {
    console.error("Erreur caution:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
