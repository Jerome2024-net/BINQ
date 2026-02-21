"use client";

import { useState, useEffect, useCallback } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useAuth } from "@/contexts/AuthContext";
import {
  PiggyBank,
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  Target,
  Calendar,
  Clock,
  X,
  Loader2,
  ChevronLeft,
  Lock,
  Wallet,
  CreditCard,
  Trash2,
  Building,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

interface CarteEnregistree {
  id: string;
  marque: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

interface Epargne {
  id: string;
  nom: string;
  type: "libre" | "objectif" | "programmee";
  devise: string;
  solde: number;
  objectif_montant: number | null;
  objectif_date: string | null;
  montant_auto: number | null;
  frequence_auto: string | null;
  source_auto: string | null;
  prochaine_date_auto: string | null;
  bloque_jusqu_a: string | null;
  icone: string;
  couleur: string;
  statut: string;
  created_at: string;
}

interface Transaction {
  id: string;
  epargne_id: string;
  type: string;
  montant: number;
  solde_apres: number;
  description: string;
  created_at: string;
}

const ICONES = ["💰", "🏠", "✈️", "🎓", "🚗", "💍", "🏥", "📱", "👶", "🎯", "🌍", "⭐"];
const COULEURS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6"];

function formatDevise(montant: number, devise: string = "EUR"): string {
  if (devise === "USD") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(montant);
  }
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(montant);
}

export default function EpargnePage() {
  const { user } = useAuth();
  const [epargnes, setEpargnes] = useState<Epargne[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEpargne, setSelectedEpargne] = useState<Epargne | null>(null);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const chargerEpargnes = useCallback(async () => {
    try {
      const res = await fetch("/api/epargne");
      const data = await res.json();
      if (data.epargnes) setEpargnes(data.epargnes);
    } catch (err) {
      console.error("Erreur chargement épargnes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const chargerTransactions = useCallback(async (epargneId: string) => {
    setLoadingTx(true);
    try {
      const res = await fetch(`/api/epargne/transaction?epargne_id=${epargneId}`);
      const data = await res.json();
      if (data.transactions) setTransactions(data.transactions);
    } catch (err) {
      console.error("Erreur chargement transactions:", err);
    } finally {
      setLoadingTx(false);
    }
  }, []);

  useEffect(() => {
    chargerEpargnes();
  }, [chargerEpargnes]);

  useEffect(() => {
    if (selectedEpargne) chargerTransactions(selectedEpargne.id);
  }, [selectedEpargne, chargerTransactions]);

  const totalEpargne = epargnes.reduce((sum, e) => sum + Number(e.solde), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // ── Vue détaillée d'un compte ──
  if (selectedEpargne) {
    const ep = selectedEpargne;
    const progress = ep.objectif_montant ? Math.min((Number(ep.solde) / Number(ep.objectif_montant)) * 100, 100) : 0;

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setSelectedEpargne(null); setTransactions([]); }}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: ep.couleur + "20" }}>
              {ep.icone}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{ep.nom}</h1>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: ep.couleur + "20", color: ep.couleur }}>
                {ep.type === "libre" ? "Libre" : ep.type === "objectif" ? "Objectif" : "Programmée"}
              </span>
            </div>
          </div>
        </div>

        {/* Solde */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Solde actuel</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{formatDevise(Number(ep.solde), ep.devise)}</p>

          {ep.type === "objectif" && ep.objectif_montant && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>Progression</span>
                <span>{Math.round(progress)}% — Objectif {formatDevise(Number(ep.objectif_montant), ep.devise)}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: ep.couleur }} />
              </div>
              {ep.objectif_date && (
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Échéance : {new Date(ep.objectif_date).toLocaleDateString("fr-FR")}
                </p>
              )}
            </div>
          )}

          {ep.type === "programmee" && (
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 text-sm bg-indigo-50 px-3 py-1.5 rounded-lg text-indigo-700">
                <Clock className="w-4 h-4" />
                {formatDevise(Number(ep.montant_auto), ep.devise)} / {ep.frequence_auto === "quotidien" ? "jour" : ep.frequence_auto === "hebdomadaire" ? "semaine" : "mois"}
              </div>

            </div>
          )}

          {ep.bloque_jusqu_a && new Date(ep.bloque_jusqu_a) > new Date() && (
            <div className="mt-3 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg">
              <Lock className="w-4 h-4" />
              Bloquée jusqu&apos;au {new Date(ep.bloque_jusqu_a).toLocaleDateString("fr-FR")}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={() => setShowDeposit(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              <ArrowDownCircle className="w-5 h-5" />
              Déposer
            </button>
            <button
              onClick={() => setShowWithdraw(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              <ArrowUpCircle className="w-5 h-5" />
              Retirer
            </button>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Historique</h2>
          {loadingTx ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Aucune transaction</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => {
                const isPositive = Number(tx.montant) > 0;
                return (
                  <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isPositive ? "bg-green-50" : "bg-red-50"}`}>
                        {isPositive ? <ArrowDownCircle className="w-4 h-4 text-green-600" /> : <ArrowUpCircle className="w-4 h-4 text-red-500" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                        <p className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${isPositive ? "text-green-600" : "text-red-500"}`}>
                      {isPositive ? "+" : ""}{formatDevise(Number(tx.montant), ep.devise)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Dépôt */}
        {showDeposit && (
          <DepositModal
            epargne={ep}
            onClose={() => setShowDeposit(false)}
            onSuccess={() => {
              setShowDeposit(false);
              chargerEpargnes().then(() => {
                const updated = epargnes.find(e => e.id === ep.id);
                if (updated) setSelectedEpargne(updated);
              });
              chargerTransactions(ep.id);
            }}
            actionLoading={actionLoading}
            setActionLoading={setActionLoading}
          />
        )}

        {/* Modal Retrait */}
        {showWithdraw && (
          <WithdrawModal
            epargne={ep}
            onClose={() => setShowWithdraw(false)}
            onSuccess={() => {
              setShowWithdraw(false);
              chargerEpargnes().then(() => {
                const updated = epargnes.find(e => e.id === ep.id);
                if (updated) setSelectedEpargne(updated);
              });
              chargerTransactions(ep.id);
            }}
            actionLoading={actionLoading}
            setActionLoading={setActionLoading}
          />
        )}
      </div>
    );
  }

  // ── Vue principale : liste des comptes ──
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header with quick creation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Mon Épargne</h1>
          <p className="text-gray-500 mt-1">
            Gérez vos comptes et visualisez votre progression vers vos objectifs.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="group flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all text-sm sm:text-base"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          Nouveau compte
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl p-5 sm:p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4 opacity-90">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/10">
                <PiggyBank className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium tracking-wide uppercase">Total Épargné</span>
            </div>
            
            <div className="space-y-1">
              {epargnes.filter(e => (e.devise || "EUR") === "EUR").length > 0 && (
                <p className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {formatDevise(epargnes.filter(e => (e.devise || "EUR") === "EUR").reduce((sum, e) => sum + Number(e.solde), 0), "EUR")}
                </p>
              )}
              {epargnes.filter(e => e.devise === "USD").length > 0 && (
                <p className="text-xl sm:text-2xl font-bold tracking-tight opacity-90">
                  {formatDevise(epargnes.filter(e => e.devise === "USD").reduce((sum, e) => sum + Number(e.solde), 0), "USD")}
                </p>
              )}
              {epargnes.length === 0 && <p className="text-2xl sm:text-3xl font-bold tracking-tight">0,00 €</p>}
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-colors">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Devises</span>
            </div>
            <p className="text-xl font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
              EUR / USD
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group hover:border-purple-200 transition-colors">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                <Target className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Comptes actifs</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
              {epargnes.length}
            </p>
          </div>
        </div>
      </div>

      {/* Grid des comptes */}
      {epargnes.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center hover:border-indigo-300 transition-colors group">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
            <PiggyBank className="w-10 h-10 text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Votre aventure commence ici</h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Créez votre premier compte d&apos;épargne et commencez à mettre de l&apos;argent de côté pour vos projets, avec des intérêts annuels.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all"
          >
            <Plus className="w-5 h-5" />
            Créer mon premier compte
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {epargnes.map((ep) => {
            const progress = ep.objectif_montant ? Math.min((Number(ep.solde) / Number(ep.objectif_montant)) * 100, 100) : 0;
            const isProgrammee = ep.type === "programmee";
            const isObjectif = ep.type === "objectif";
            
            return (
              <button
                key={ep.id}
                onClick={() => setSelectedEpargne(ep)}
                className="group relative flex flex-col bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-sm hover:shadow-xl hover:translate-y-[-2px] hover:border-indigo-100 transition-all text-left duration-300"
              >
                {/* Header Card */}
                <div className="flex items-start justify-between mb-6 w-full">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm transition-transform group-hover:rotate-6"
                      style={{ backgroundColor: (ep.couleur || "#6366f1") + "15", color: ep.couleur || "#6366f1" }}
                    >
                      {ep.icone}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{ep.nom}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                          isProgrammee ? "bg-purple-50 text-purple-700" : 
                          isObjectif ? "bg-amber-50 text-amber-700" : 
                          "bg-indigo-50 text-indigo-700"
                        }`}>
                          {ep.type === "libre" ? "Libre" : ep.type === "objectif" ? "Objectif" : "Programmée"}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-gray-100 text-gray-600">
                          {ep.devise || "EUR"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {ep.bloque_jusqu_a && new Date(ep.bloque_jusqu_a) > new Date() && (
                    <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center text-amber-500" title="Bloqué">
                      <Lock className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Amount */}
                <div className="mb-6">
                  <p className="text-sm text-gray-400 font-medium mb-1">Solde actuel</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{formatDevise(Number(ep.solde), ep.devise)}</p>
                </div>

                {/* Footer / Progress */}
                <div className="mt-auto w-full pt-4 border-t border-gray-50">
                  {isObjectif && ep.objectif_montant && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-medium">
                        <span className="text-gray-500">Objectif : {formatDevise(Number(ep.objectif_montant), ep.devise)}</span>
                        <span style={{ color: ep.couleur }}>{Math.round(progress)}%</span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-1000 ease-out" 
                          style={{ width: `${progress}%`, backgroundColor: ep.couleur || "#6366f1" }} 
                        />
                      </div>
                    </div>
                  )}

                  {isProgrammee && ep.montant_auto && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-xl">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        <span className="font-semibold text-gray-900">{formatDevise(Number(ep.montant_auto), ep.devise)}</span>
                        {" / "}{ep.frequence_auto === "quotidien" ? "jour" : ep.frequence_auto === "hebdomadaire" ? "semaine" : "mois"}
                      </span>
                    </div>
                  )}

                  {ep.type === "libre" && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <ArrowUpCircle className="w-4 h-4 text-emerald-500" />
                      <span>Dépôts et retraits libres</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
          
          {/* Add New Card (at the end of grid) */}
          <button
            onClick={() => setShowCreate(true)}
            className="group flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-dashed border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/10 transition-all min-h-[280px]"
          >
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 shadow-sm group-hover:scale-110 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all mb-4">
              <Plus className="w-8 h-8" />
            </div>
            <span className="font-bold text-gray-500 group-hover:text-indigo-600 transition-colors">Créer un nouveau compte</span>
          </button>
        </div>
      )}

      {/* Modal Créer */}
      {showCreate && (
        <CreateEpargneModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            chargerEpargnes();
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// COMPOSANT : Modal Création
// ═══════════════════════════════════════════
function CreateEpargneModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [nom, setNom] = useState("");
  const [type, setType] = useState<"libre" | "objectif" | "programmee">("libre");
  const [objectifMontant, setObjectifMontant] = useState("");
  const [objectifDate, setObjectifDate] = useState("");
  const [montantAuto, setMontantAuto] = useState("");
  const [frequenceAuto, setFrequenceAuto] = useState("mensuel");
  const [sourceAuto, setSourceAuto] = useState("wallet");
  const [bloqueJusqua, setBloqueJusqua] = useState("");
  const [icone, setIcone] = useState("💰");
  const [couleur, setCouleur] = useState("#6366f1");
  const [devise, setDevise] = useState<"EUR" | "USD">("EUR");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!nom.trim()) {
      setError("Nom requis");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/epargne", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom,
          type,
          objectif_montant: type === "objectif" ? Number(objectifMontant) : null,
          objectif_date: type === "objectif" ? objectifDate : null,
          montant_auto: type === "programmee" ? Number(montantAuto) : null,
          frequence_auto: type === "programmee" ? frequenceAuto : null,
          source_auto: type === "programmee" ? sourceAuto : null,
          bloque_jusqu_a: bloqueJusqua || null,
          icone,
          couleur,
          devise,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Nouveau compte d&apos;épargne</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
          )}

          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom du compte</label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Vacances, Maison, Urgences..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Type d&apos;épargne</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "libre", label: "Libre", desc: "Sans contrainte" },
                { value: "objectif", label: "Objectif", desc: "Avec but" },
                { value: "programmee", label: "Programmée", desc: "Automatique" },
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value as typeof type)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    type === t.value ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900">{t.label}</p>
                  <p className="text-xs text-gray-500">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Devise */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Devise</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "EUR", label: "EUR €", desc: "Euro" },
                { value: "USD", label: "USD $", desc: "Dollar" },
              ].map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDevise(d.value as "EUR" | "USD")}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    devise === d.value ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900">{d.label}</p>
                  <p className="text-xs text-gray-500">{d.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Objectif */}
          {type === "objectif" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Montant objectif ({devise})</label>
                <input
                  type="number"
                  value={objectifMontant}
                  onChange={(e) => setObjectifMontant(e.target.value)}
                  placeholder="500 000"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date limite</label>
                <input
                  type="date"
                  value={objectifDate}
                  onChange={(e) => setObjectifDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
                />
              </div>
            </div>
          )}

          {/* Programmée */}
          {type === "programmee" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Montant auto ({devise})</label>
                  <input
                    type="number"
                    value={montantAuto}
                    onChange={(e) => setMontantAuto(e.target.value)}
                    placeholder="10 000"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Fréquence</label>
                  <select
                    value={frequenceAuto}
                    onChange={(e) => setFrequenceAuto(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
                  >
                    <option value="quotidien">Quotidien</option>
                    <option value="hebdomadaire">Hebdomadaire</option>
                    <option value="mensuel">Mensuel</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Source</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSourceAuto("wallet")}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      sourceAuto === "wallet" ? "border-indigo-500 bg-indigo-50" : "border-gray-200"
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    <span className="text-sm font-medium">Portefeuille</span>
                  </button>
                  <button
                    onClick={() => setSourceAuto("carte")}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      sourceAuto === "carte" ? "border-indigo-500 bg-indigo-50" : "border-gray-200"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span className="text-sm font-medium">Carte</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Blocage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Bloquer jusqu&apos;au <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <input
              type="date"
              value={bloqueJusqua}
              onChange={(e) => setBloqueJusqua(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
            />
          </div>

          {/* Icône et Couleur */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Icône</label>
              <div className="flex flex-wrap gap-1.5">
                {ICONES.map((ic) => (
                  <button
                    key={ic}
                    onClick={() => setIcone(ic)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                      icone === ic ? "bg-indigo-100 ring-2 ring-indigo-500" : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Couleur</label>
              <div className="flex flex-wrap gap-1.5">
                {COULEURS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCouleur(c)}
                    className={`w-9 h-9 rounded-lg transition-all ${
                      couleur === c ? "ring-2 ring-offset-2 ring-indigo-500" : ""
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            Créer
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// COMPOSANT : Formulaire Stripe Elements pour ajouter une carte
// ═══════════════════════════════════════════
function AddCardForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const { error } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/epargne`,
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message || "Erreur lors de l'enregistrement");
      } else {
        onSuccess();
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erreur");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border border-gray-200 rounded-xl p-4 bg-white">
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{errorMessage}</div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-semibold text-gray-600 hover:bg-gray-50"
        >
          Retour
        </button>
        <button
          type="submit"
          disabled={!stripe || !elements || isSubmitting}
          className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
          Enregistrer la carte
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Sécurisé par Stripe · Vos données ne sont jamais stockées sur nos serveurs</span>
      </div>
    </form>
  );
}

// ═══════════════════════════════════════════
// COMPOSANT : Modal Dépôt
// ═══════════════════════════════════════════
function DepositModal({
  epargne,
  onClose,
  onSuccess,
  actionLoading,
  setActionLoading,
}: {
  epargne: Epargne;
  onClose: () => void;
  onSuccess: () => void;
  actionLoading: boolean;
  setActionLoading: (v: boolean) => void;
}) {
  const [montant, setMontant] = useState("");
  const [source, setSource] = useState<"depot_wallet" | "depot_carte">("depot_wallet");
  const [error, setError] = useState("");
  const [cartes, setCartes] = useState<CarteEnregistree[]>([]);
  const [loadingCartes, setLoadingCartes] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [setupClientSecret, setSetupClientSecret] = useState("");
  const [loadingSetup, setLoadingSetup] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Charger les cartes existantes
  const chargerCartes = useCallback(async () => {
    setLoadingCartes(true);
    try {
      const res = await fetch("/api/epargne/setup-card");
      const data = await res.json();
      if (data.cartes) {
        setCartes(data.cartes);
        if (data.cartes.length > 0) {
          setSelectedCardId(data.cartes[0].id);
        }
      }
    } catch (err) {
      console.error("Erreur chargement cartes:", err);
    } finally {
      setLoadingCartes(false);
    }
  }, []);

  useEffect(() => {
    chargerCartes();
  }, [chargerCartes]);

  // Lancer le SetupIntent pour ajouter une carte
  const handleAddCard = async () => {
    setLoadingSetup(true);
    setError("");
    try {
      const res = await fetch("/api/epargne/setup-card", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSetupClientSecret(data.clientSecret);
      setShowAddCard(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoadingSetup(false);
    }
  };

  // Après ajout réussi d'une carte
  const handleCardAdded = () => {
    setShowAddCard(false);
    setSetupClientSecret("");
    chargerCartes();
  };

  const handleDeposit = async () => {
    const m = Number(montant);
    if (!m || m <= 0) {
      setError("Montant invalide");
      return;
    }
    if (source === "depot_carte" && !selectedCardId) {
      setError("Veuillez sélectionner ou ajouter une carte");
      return;
    }
    setActionLoading(true);
    setError("");

    try {
      const res = await fetch("/api/epargne/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          epargne_id: epargne.id,
          type: source,
          montant: m,
          description: source === "depot_wallet" ? "Dépôt depuis portefeuille" : "Dépôt par carte",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setActionLoading(false);
    }
  };

  const brandIcon = (brand: string) => {
    const b = brand.toLowerCase();
    if (b === "visa") return "💳 Visa";
    if (b === "mastercard") return "💳 Mastercard";
    if (b === "amex") return "💳 Amex";
    return `💳 ${brand}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Déposer sur {epargne.nom}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

          {/* Mode ajout de carte via Stripe Elements */}
          {showAddCard && setupClientSecret ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: setupClientSecret,
                appearance: {
                  theme: "stripe",
                  variables: { colorPrimary: "#6366f1", borderRadius: "12px" },
                },
                locale: "fr",
              }}
            >
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Ajouter une carte bancaire</h3>
                <AddCardForm
                  onSuccess={handleCardAdded}
                  onCancel={() => { setShowAddCard(false); setSetupClientSecret(""); }}
                />
              </div>
            </Elements>
          ) : (
            <>
              {/* Montant */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Montant ({epargne.devise})</label>
                <input
                  type="number"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  placeholder="10 000"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-lg font-semibold"
                />
              </div>

              {/* Source */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Source</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSource("depot_wallet")}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      source === "depot_wallet" ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Wallet className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium">Portefeuille</span>
                  </button>
                  <button
                    onClick={() => setSource("depot_carte")}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      source === "depot_carte" ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium">Carte</span>
                  </button>
                </div>
              </div>

              {/* Récapitulatif frais 2% */}
              {Number(montant) > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>Montant épargné</span>
                    <span className="font-medium">{formatDevise(Number(montant), epargne.devise)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-amber-700">
                    <span>Frais Binq (2%)</span>
                    <span className="font-medium">{formatDevise(Math.round(Number(montant) * 0.02 * 100) / 100, epargne.devise)}</span>
                  </div>
                  <div className="border-t border-amber-200 pt-1 flex justify-between text-sm font-bold text-gray-900">
                    <span>Total débité</span>
                    <span>{formatDevise(Number(montant) + Math.round(Number(montant) * 0.02 * 100) / 100, epargne.devise)}</span>
                  </div>
                </div>
              )}

              {/* Sélection / ajout de carte */}
              {source === "depot_carte" && (
                <div className="space-y-3">
                  {loadingCartes ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                  ) : cartes.length > 0 ? (
                    <>
                      <label className="block text-sm font-medium text-gray-700">Carte enregistrée</label>
                      <div className="space-y-2">
                        {cartes.map((carte) => (
                          <button
                            key={carte.id}
                            onClick={() => setSelectedCardId(carte.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                              selectedCardId === carte.id ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                              selectedCardId === carte.id ? "bg-indigo-100" : "bg-gray-100"
                            }`}>
                              <CreditCard className="w-5 h-5 text-gray-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{brandIcon(carte.marque)}</p>
                              <p className="text-xs text-gray-500">•••• {carte.last4} — Exp. {String(carte.exp_month).padStart(2, "0")}/{carte.exp_year}</p>
                            </div>
                            {selectedCardId === carte.id && (
                              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-xl text-center">
                      <CreditCard className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Aucune carte enregistrée</p>
                    </div>
                  )}

                  <button
                    onClick={handleAddCard}
                    disabled={loadingSetup}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-300 text-sm font-medium text-gray-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all"
                  >
                    {loadingSetup ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Ajouter une carte
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer — caché pendant l'ajout de carte */}
        {!showAddCard && (
          <div className="p-6 border-t border-gray-100 flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-semibold text-gray-600 hover:bg-gray-50">
              Annuler
            </button>
            <button
              onClick={handleDeposit}
              disabled={actionLoading || (source === "depot_carte" && !selectedCardId)}
              className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowDownCircle className="w-5 h-5" />}
              {Number(montant) > 0
                ? `Déposer (${formatDevise(Number(montant) + Math.round(Number(montant) * 0.02 * 100) / 100, epargne.devise)})`
                : "Déposer"
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// COMPOSANT : Modal Retrait
// ═══════════════════════════════════════════
function WithdrawModal({
  epargne,
  onClose,
  onSuccess,
  actionLoading,
  setActionLoading,
}: {
  epargne: Epargne;
  onClose: () => void;
  onSuccess: () => void;
  actionLoading: boolean;
  setActionLoading: (v: boolean) => void;
}) {
  const [montant, setMontant] = useState("");
  const [destination, setDestination] = useState<"retrait" | "retrait_banque">("retrait");
  const [error, setError] = useState("");

  const isBloque = epargne.bloque_jusqu_a && new Date(epargne.bloque_jusqu_a) > new Date();

  const handleWithdraw = async () => {
    const m = Number(montant);
    if (!m || m <= 0) {
      setError("Montant invalide");
      return;
    }
    if (m > Number(epargne.solde)) {
      setError("Solde insuffisant");
      return;
    }
    setActionLoading(true);
    setError("");

    try {
      const res = await fetch("/api/epargne/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          epargne_id: epargne.id,
          type: destination,
          montant: m,
          description: destination === "retrait_banque" ? "Virement vers compte bancaire" : "Retrait vers portefeuille",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Retirer de {epargne.nom}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

          {isBloque ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
              <Lock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-amber-800">
                Épargne bloquée jusqu&apos;au {new Date(epargne.bloque_jusqu_a!).toLocaleDateString("fr-FR")}
              </p>
            </div>
          ) : (
            <>
              {/* Destination */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Destination</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDestination("retrait")}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      destination === "retrait" ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Wallet className="w-5 h-5 text-gray-600" />
                    <div className="text-left">
                      <span className="text-sm font-medium block">Portefeuille</span>
                      <span className="text-xs text-gray-400">Instantané</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setDestination("retrait_banque")}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      destination === "retrait_banque" ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Building className="w-5 h-5 text-gray-600" />
                    <div className="text-left">
                      <span className="text-sm font-medium block">Compte bancaire</span>
                      <span className="text-xs text-gray-400">1-3 jours</span>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Montant ({epargne.devise}) — Disponible : {formatDevise(Number(epargne.solde), epargne.devise)}
                </label>
                <input
                  type="number"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  max={Number(epargne.solde)}
                  placeholder="10 000"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-lg font-semibold"
                />
              </div>
              <button
                onClick={() => setMontant(String(Number(epargne.solde)))}
                className="text-sm text-indigo-600 font-medium hover:underline"
              >
                Retirer tout
              </button>

              {destination === "retrait_banque" && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 flex items-start gap-2">
                  <Building className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Le virement sera envoyé vers votre compte bancaire vérifié via Stripe. Délai : 1 à 3 jours ouvrés.</span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-semibold text-gray-600 hover:bg-gray-50">
            Annuler
          </button>
          <button
            onClick={handleWithdraw}
            disabled={actionLoading || !!isBloque}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUpCircle className="w-5 h-5" />}
            Retirer
          </button>
        </div>
      </div>
    </div>
  );
}
