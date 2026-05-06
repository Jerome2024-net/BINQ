"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/contexts/AuthContext";
import { formatMontant } from "@/lib/currencies";
import type { DeviseCode } from "@/lib/currencies";
import { getMapboxDirectionsUrl } from "@/lib/mapbox";
import {
  CheckCircle2,
  Loader2,
  MapPin,
  Navigation,
  Package,
  Phone,
  Truck,
} from "lucide-react";

const MapboxDeliveryMap = dynamic(() => import("@/components/location/MapboxDeliveryMap"), {
  ssr: false,
  loading: () => <div className="h-72 rounded-3xl bg-blue-50 border border-blue-100 animate-pulse" />,
});

interface Commande {
  id: string;
  montant: number;
  devise: string;
  statut: string;
  reference: string;
  client_nom?: string | null;
  client_telephone?: string | null;
  adresse_livraison?: string | null;
  delivery_latitude?: number | null;
  delivery_longitude?: number | null;
  delivery_geocoded_address?: string | null;
  note_livraison?: string | null;
  frais_livraison?: number | null;
  montant_livreur?: number | null;
  montant_total?: number | null;
  note?: string | null;
  created_at: string;
  boutique?: { id: string; nom: string; slug: string; logo_url: string | null } | null;
  produit?: { id: string; nom: string; image_url: string | null; prix: number; devise: string } | null;
}

interface Stats {
  totalLivraisons?: number;
  nbLivraisons?: number;
}

const statusLabels: Record<string, string> = {
  payee: "Payée",
  acceptee: "Acceptée",
  preparation: "Préparation",
  en_livraison: "En livraison",
  livree: "Livrée",
  annulee: "Annulée",
};

function parseDeliveryNote(c: Commande) {
  try {
    const parsed = c.note ? JSON.parse(c.note) : null;
    return parsed?.type === "local_delivery" ? parsed : null;
  } catch {
    return null;
  }
}

function getDeliveryInfo(c: Commande) {
  const note = parseDeliveryNote(c);
  const latitude = Number(c.delivery_latitude ?? note?.delivery_latitude);
  const longitude = Number(c.delivery_longitude ?? note?.delivery_longitude);
  const hasCoords = Number.isFinite(latitude) && Number.isFinite(longitude);

  return {
    clientNom: c.client_nom || note?.client_nom || "Client",
    telephone: c.client_telephone || note?.client_telephone || null,
    adresse: c.delivery_geocoded_address || c.adresse_livraison || note?.delivery_geocoded_address || note?.adresse_livraison || null,
    note: c.note_livraison || note?.note_livraison || null,
    latitude: hasCoords ? latitude : null,
    longitude: hasCoords ? longitude : null,
  };
}

export default function LivraisonsPage() {
  const { user } = useAuth();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);
  const [activationMessage, setActivationMessage] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchLivraisons = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/commandes?role=livreur&limit=50");
        const data = await res.json();
        const nextCommandes = data.commandes || [];
        setCommandes(nextCommandes);
        setStats(data.stats || null);
        setSelectedId((current) => current || nextCommandes[0]?.id || null);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetchLivraisons();
  }, [user]);

  const selected = useMemo(
    () => commandes.find((commande) => commande.id === selectedId) || commandes[0] || null,
    [commandes, selectedId]
  );
  const selectedInfo = selected ? getDeliveryInfo(selected) : null;
  const selectedDirectionsUrl = selectedInfo
    ? getMapboxDirectionsUrl({ latitude: selectedInfo.latitude, longitude: selectedInfo.longitude, address: selectedInfo.adresse })
    : null;

  const updateStatut = async (commandeId: string, statut: string) => {
    setUpdatingId(commandeId);
    try {
      const res = await fetch("/api/commandes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commande_id: commandeId, statut }),
      });
      const data = await res.json();
      if (res.ok && data.commande) {
        setCommandes((prev) => prev.map((commande) => commande.id === commandeId ? { ...commande, ...data.commande } : commande));
      }
    } catch { /* ignore */ }
    finally { setUpdatingId(null); }
  };

  const activateLivreur = async () => {
    setActivating(true);
    setActivationMessage("");
    try {
      const res = await fetch("/api/livreurs", { method: "POST" });
      const data = await res.json();
      setActivationMessage(res.ok ? "Profil livreur activé. Les marchands peuvent maintenant vous assigner des commandes." : data.error || "Activation impossible.");
    } catch {
      setActivationMessage("Erreur réseau. Réessayez.");
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-1 pt-2 pb-28">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Livreur</p>
          <h1 className="text-[24px] font-black tracking-tight text-gray-950">Mes livraisons</h1>
          <p className="text-sm text-gray-500 mt-1">Suivi Mapbox de la localisation client.</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right">
          <p className="text-lg font-black text-emerald-700">{stats?.nbLivraisons || commandes.length}</p>
          <p className="text-[11px] font-bold text-emerald-700">assignées</p>
        </div>
      </div>

      {stats?.totalLivraisons ? (
        <div className="mt-5 rounded-3xl bg-gray-950 text-white p-5">
          <p className="text-xs text-white/50 font-bold uppercase tracking-wide">Gains livraison estimés</p>
          <p className="text-3xl font-black mt-1">{formatMontant(stats.totalLivraisons, "XOF")}</p>
        </div>
      ) : null}

      {commandes.length === 0 ? (
        <div className="mt-10 text-center py-20 rounded-3xl bg-gray-50 border border-gray-100">
          <Truck className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-sm font-black text-gray-900">Aucune livraison assignée</p>
          <p className="text-sm text-gray-500 mt-1">Les commandes assignées au livreur apparaîtront ici.</p>
          <button
            onClick={activateLivreur}
            disabled={activating}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white disabled:opacity-60"
          >
            {activating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
            Activer mon profil livreur
          </button>
          {activationMessage && <p className="mt-3 text-xs font-semibold text-emerald-700">{activationMessage}</p>}
        </div>
      ) : (
        <div className="mt-6 grid lg:grid-cols-[360px_1fr] gap-5">
          <div className="space-y-2">
            {commandes.map((commande) => {
              const info = getDeliveryInfo(commande);
              const active = selected?.id === commande.id;
              const devise = (commande.devise as DeviseCode) || "XOF";
              return (
                <button
                  key={commande.id}
                  onClick={() => setSelectedId(commande.id)}
                  className={`w-full text-left rounded-3xl border p-4 transition ${active ? "border-emerald-200 bg-emerald-50" : "border-gray-100 bg-gray-50 hover:bg-gray-100"}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-gray-950 truncate">{info.clientNom}</p>
                      <p className="text-xs text-gray-500 truncate">{commande.boutique?.nom || commande.reference}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-emerald-700 bg-white rounded-full px-2 py-1">
                          {statusLabels[commande.statut] || commande.statut}
                        </span>
                        <span className="text-xs font-black text-gray-950">
                          {formatMontant(Number(commande.montant_livreur || commande.frais_livraison || 0), devise)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {selected && selectedInfo && (
            <div className="rounded-[2rem] border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-gray-400">Commande {selected.reference}</p>
                    <h2 className="text-xl font-black text-gray-950 mt-1">{selectedInfo.clientNom}</h2>
                    <p className="text-sm text-gray-500 mt-1">{selected.boutique?.nom || "Commerce local"}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700">
                    {statusLabels[selected.statut] || selected.statut}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  {selectedInfo.telephone && (
                    <a href={`tel:${selectedInfo.telephone}`} className="flex items-center gap-2 font-bold text-gray-900">
                      <Phone className="w-4 h-4 text-emerald-600" /> {selectedInfo.telephone}
                    </a>
                  )}
                  {selectedInfo.adresse && (
                    <p className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600 mt-0.5" /> {selectedInfo.adresse}
                    </p>
                  )}
                  {selectedInfo.note && <p className="rounded-2xl bg-gray-50 px-3 py-2 text-xs text-gray-500">Note : {selectedInfo.note}</p>}
                </div>
              </div>

              <div className="p-5">
                {selectedInfo.latitude && selectedInfo.longitude ? (
                  <MapboxDeliveryMap
                    clientLatitude={selectedInfo.latitude}
                    clientLongitude={selectedInfo.longitude}
                    clientAddress={selectedInfo.adresse}
                  />
                ) : (
                  <div className="rounded-3xl bg-amber-50 border border-amber-100 p-5 text-sm text-amber-700">
                    <p className="font-black">Position GPS client non disponible.</p>
                    <p className="mt-1">Le livreur peut quand même ouvrir l’adresse texte si elle existe.</p>
                    {selectedDirectionsUrl && (
                      <a href={selectedDirectionsUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-3 text-xs font-black text-white">
                        <Navigation className="w-4 h-4" /> Ouvrir Mapbox
                      </a>
                    )}
                  </div>
                )}

                <div className="mt-5 flex flex-col sm:flex-row gap-2">
                  {selected.statut !== "en_livraison" && selected.statut !== "livree" && selected.statut !== "annulee" && (
                    <button
                      onClick={() => updateStatut(selected.id, "en_livraison")}
                      disabled={updatingId === selected.id}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white disabled:opacity-60"
                    >
                      {updatingId === selected.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                      Démarrer livraison
                    </button>
                  )}
                  {selected.statut !== "livree" && selected.statut !== "annulee" && (
                    <button
                      onClick={() => updateStatut(selected.id, "livree")}
                      disabled={updatingId === selected.id}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white disabled:opacity-60"
                    >
                      {updatingId === selected.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Marquer livrée
                    </button>
                  )}
                  {selected.statut === "livree" && (
                    <div className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" /> Livraison terminée
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
