import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "@/lib/api-auth";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const supabase = getServiceClient();
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "acheteur"; // "acheteur" or "vendeur"
    const statut = searchParams.get("statut");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("commandes")
      .select(`
        *,
        produit:produits(id, nom, image_url, prix, devise),
        boutique:boutiques(id, nom, slug, logo_url)
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (role === "vendeur") {
      query = query.eq("vendeur_id", user.id);
    } else {
      query = query.eq("acheteur_id", user.id);
    }

    if (statut) {
      query = query.eq("statut", statut);
    }

    const { data: commandes, error } = await query;

    if (error) {
      console.error("Commandes fetch error:", error);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    // Get stats
    const { data: achatsData } = await supabase
      .from("commandes")
      .select("montant")
      .eq("acheteur_id", user.id);

    const { data: ventesData } = await supabase
      .from("commandes")
      .select("montant")
      .eq("vendeur_id", user.id);

    const totalAchats = achatsData?.reduce((s, c) => s + Number(c.montant), 0) || 0;
    const totalVentes = ventesData?.reduce((s, c) => s + Number(c.montant), 0) || 0;
    const nbAchats = achatsData?.length || 0;
    const nbVentes = ventesData?.length || 0;

    return NextResponse.json({
      commandes: commandes || [],
      stats: { totalAchats, totalVentes, nbAchats, nbVentes },
    });
  } catch (err) {
    console.error("Commandes error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

type CheckoutItem = {
  produit_id: string;
  quantite: number;
};

function normalizePhone(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeText(value: unknown) {
  return String(value || "").trim();
}

// POST /api/commandes — Créer une commande multi-produits avec livraison locale
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    const supabase = getServiceClient();
    const body = await request.json();

    const items: CheckoutItem[] = Array.isArray(body.items) ? body.items : [];
    const clientNom = normalizeText(body.client_nom);
    const clientTelephone = normalizePhone(body.client_telephone);
    const adresseLivraison = normalizeText(body.adresse_livraison);
    const noteLivraison = normalizeText(body.note_livraison);

    if (items.length === 0) {
      return NextResponse.json({ error: "Panier vide" }, { status: 400 });
    }

    if (!clientNom || clientNom.length < 2) {
      return NextResponse.json({ error: "Nom client requis" }, { status: 400 });
    }

    if (!clientTelephone || clientTelephone.length < 6) {
      return NextResponse.json({ error: "Téléphone client requis" }, { status: 400 });
    }

    if (!adresseLivraison || adresseLivraison.length < 5) {
      return NextResponse.json({ error: "Adresse de livraison requise" }, { status: 400 });
    }

    const uniqueItems = new Map<string, number>();
    for (const item of items) {
      const produitId = normalizeText(item.produit_id);
      const quantite = Math.max(1, Math.min(99, Number(item.quantite) || 1));
      if (!produitId) continue;
      uniqueItems.set(produitId, (uniqueItems.get(produitId) || 0) + quantite);
    }

    if (uniqueItems.size === 0) {
      return NextResponse.json({ error: "Panier invalide" }, { status: 400 });
    }

    const produitIds = Array.from(uniqueItems.keys());
    const { data: produits, error: produitsErr } = await supabase
      .from("produits")
      .select(`
        id, nom, prix, devise, image_url, stock, ventes, is_active,
        boutique:boutiques(id, user_id, nom, slug, logo_url, devise, is_active)
      `)
      .in("id", produitIds)
      .eq("is_active", true);

    if (produitsErr) throw produitsErr;
    if (!produits || produits.length !== produitIds.length) {
      return NextResponse.json({ error: "Un produit du panier est indisponible" }, { status: 400 });
    }

    const boutique = (produits[0] as any).boutique;
    if (!boutique?.id || boutique.is_active === false) {
      return NextResponse.json({ error: "Commerce indisponible" }, { status: 400 });
    }

    if (user && boutique.user_id === user.id) {
      return NextResponse.json({ error: "Vous ne pouvez pas commander dans votre propre commerce" }, { status: 400 });
    }

    for (const produit of produits as any[]) {
      if (produit.boutique?.id !== boutique.id) {
        return NextResponse.json({ error: "Une commande doit venir d'un seul commerce" }, { status: 400 });
      }
      const quantite = uniqueItems.get(produit.id) || 1;
      if (produit.stock !== null && produit.stock < quantite) {
        return NextResponse.json({ error: `${produit.nom} n'a pas assez de stock` }, { status: 400 });
      }
    }

    const devise = (produits[0] as any).devise || boutique.devise || "XOF";
    const lignes = (produits as any[]).map((produit) => {
      const quantite = uniqueItems.get(produit.id) || 1;
      const prixUnitaire = Number(produit.prix) || 0;
      return {
        produit,
        quantite,
        prix_unitaire: prixUnitaire,
        total: prixUnitaire * quantite,
      };
    });

    const sousTotal = lignes.reduce((sum, ligne) => sum + ligne.total, 0);
    const fraisLivraison = Number.isFinite(Number(body.frais_livraison))
      ? Math.max(0, Number(body.frais_livraison))
      : sousTotal >= 10000
        ? 0
        : 1000;
    const montantTotal = sousTotal + fraisLivraison;
    const reference = `CMD-${Date.now().toString(36).toUpperCase()}`;
    const firstLine = lignes[0];

    const legacyNote = JSON.stringify({
      type: "local_delivery",
      client_nom: clientNom,
      client_telephone: clientTelephone,
      adresse_livraison: adresseLivraison,
      note_livraison: noteLivraison || null,
      sous_total: sousTotal,
      frais_livraison: fraisLivraison,
      items: lignes.map((ligne) => ({
        produit_id: ligne.produit.id,
        nom: ligne.produit.nom,
        quantite: ligne.quantite,
        prix_unitaire: ligne.prix_unitaire,
      })),
    });

    const extendedPayload = {
      acheteur_id: user?.id || null,
      boutique_id: boutique.id,
      produit_id: firstLine.produit.id,
      vendeur_id: boutique.user_id,
      montant: montantTotal,
      montant_total: montantTotal,
      sous_total: sousTotal,
      frais_livraison: fraisLivraison,
      devise,
      statut: "nouvelle",
      methode_paiement: "mobile_money",
      reference,
      client_nom: clientNom,
      client_telephone: clientTelephone,
      adresse_livraison: adresseLivraison,
      note_livraison: noteLivraison || null,
      note: legacyNote,
    };

    let { data: commande, error: commandeErr } = await supabase
      .from("commandes")
      .insert(extendedPayload)
      .select()
      .single();

    // Compatibilité si la migration Glovo n'est pas encore appliquée.
    if (commandeErr) {
      const { data: fallback, error: fallbackErr } = await supabase
        .from("commandes")
        .insert({
          acheteur_id: user?.id || null,
          boutique_id: boutique.id,
          produit_id: firstLine.produit.id,
          vendeur_id: boutique.user_id,
          montant: montantTotal,
          devise,
          statut: "payee",
          methode_paiement: "mobile_money",
          reference,
          note: legacyNote,
        })
        .select()
        .single();

      if (fallbackErr) throw fallbackErr;
      commande = fallback;
    }

    if (commande?.id) {
      await supabase.from("commande_items").insert(
        lignes.map((ligne) => ({
          commande_id: commande.id,
          produit_id: ligne.produit.id,
          nom_produit: ligne.produit.nom,
          image_url: ligne.produit.image_url || null,
          quantite: ligne.quantite,
          prix_unitaire: ligne.prix_unitaire,
          total: ligne.total,
          devise,
        }))
      );

      await Promise.allSettled(
        lignes.map((ligne) => {
          const updates: Record<string, number> = {
            ventes: Number(ligne.produit.ventes || 0) + ligne.quantite,
          };
          if (ligne.produit.stock !== null) {
            updates.stock = Math.max(0, Number(ligne.produit.stock) - ligne.quantite);
          }
          return supabase.from("produits").update(updates).eq("id", ligne.produit.id);
        })
      );

      await supabase.from("notifications").insert({
        user_id: boutique.user_id,
        titre: "Nouvelle commande",
        message: `${clientNom} a commandé ${lignes.reduce((sum, ligne) => sum + ligne.quantite, 0)} article(s) pour ${montantTotal} ${devise}`,
        lu: false,
      });
    }

    return NextResponse.json({
      success: true,
      commande: {
        ...commande,
        reference,
        sous_total: sousTotal,
        frais_livraison: fraisLivraison,
        montant_total: montantTotal,
        items: lignes.map((ligne) => ({
          produit_id: ligne.produit.id,
          nom: ligne.produit.nom,
          image_url: ligne.produit.image_url,
          quantite: ligne.quantite,
          prix_unitaire: ligne.prix_unitaire,
          total: ligne.total,
        })),
        boutique: { id: boutique.id, nom: boutique.nom, slug: boutique.slug, logo_url: boutique.logo_url },
      },
    }, { status: 201 });
  } catch (err: any) {
    console.error("Commande create error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/commandes — Mettre à jour le statut d'une commande vendeur
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { commande_id, statut } = await request.json();
    const allowed = ["nouvelle", "payee", "acceptee", "preparation", "en_livraison", "confirmee", "livree", "annulee"];
    if (!commande_id || !allowed.includes(statut)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const updates: Record<string, string> = { statut, updated_at: now };
    if (statut === "acceptee") updates.accepted_at = now;
    if (statut === "preparation") updates.prepared_at = now;
    if (statut === "livree") updates.delivered_at = now;

    const supabase = getServiceClient();
    let { data: commande, error } = await supabase
      .from("commandes")
      .update(updates)
      .eq("id", commande_id)
      .eq("vendeur_id", user.id)
      .select()
      .single();

    if (error) {
      const { data: fallback, error: fallbackErr } = await supabase
        .from("commandes")
        .update({ statut })
        .eq("id", commande_id)
        .eq("vendeur_id", user.id)
        .select()
        .single();

      if (fallbackErr) throw fallbackErr;
      commande = fallback;
    }

    return NextResponse.json({ commande });
  } catch (err: any) {
    console.error("Commande update error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
