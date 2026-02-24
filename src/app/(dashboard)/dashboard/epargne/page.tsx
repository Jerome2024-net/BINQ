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

function normalizeD(d?: string | null): "EUR" | "USD" {
  return d === "USD" ? "USD" : "EUR";
}

function formatDevise(montant: number, devise: string = "EUR"): string {
  const d = normalizeD(devise);
  if (d === "USD") {
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
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // ── Vue détaillée d'un compte ──
  if (selectedEpargne) {
    const ep = selectedEpargne;
    const progress = ep.objectif_montant ? Math.min((Number(ep.solde) / Number(ep.objectif_montant)) * 100, 100) : 0;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setSelectedEpargne(null); setTransactions([]); }}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{ backgroundColor: (ep.couleur || "#6366f1") + "12" }}
          >
            {ep.icone}
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">{ep.nom}</h1>
            <span className="text-xs text-gray-400 uppercase tracking-wider">
              {ep.type === "libre" ? "Libre" : ep.type === "objectif" ? "Objectif" : "Programmée"} · {normalizeD(ep.devise)}
            </span>
          </div>
        </div>

        {/* Solde */}
        <div className="text-center py-4">
          <p className="text-sm font-medium text-gray-400 mb-2">Solde</p>
          <p className="text-4xl font-bold text-gray-900 tracking-tight">{formatDevise(Number(ep.solde), ep.devise)}</p>

          {ep.type === "objectif" && ep.objectif_montant && (
            <div className="mt-5 max-w-xs mx-auto">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>Progression</span>
                <span className="font-semibold" style={{ color: ep.couleur }}>{Math.round(progress)}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${progress}%`, backgroundColor: ep.couleur }} />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Objectif : {formatDevise(Number(ep.objectif_montant), ep.devise)}
                {ep.objectif_date && (
                  <span className="ml-2">· Échéance {new Date(ep.objectif_date).toLocaleDateString("fr-FR")}</span>
                )}
              </p>
            </div>
          )}

          {ep.type === "programmee" && ep.montant_auto && (
            <p className="text-sm text-gray-400 mt-3 flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {formatDevise(Number(ep.montant_auto), ep.devise)} / {ep.frequence_auto === "quotidien" ? "jour" : ep.frequence_auto === "hebdomadaire" ? "semaine" : "mois"}
            </p>
          )}

          {ep.bloque_jusqu_a && new Date(ep.bloque_jusqu_a) > new Date() && (
            <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
              <Lock className="w-3 h-3" />
              Bloquée jusqu&apos;au {new Date(ep.bloque_jusqu_a).toLocaleDateString("fr-FR")}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowDeposit(true)}
            className="flex-1 flex items-center justify-center gap-2.5 py-3.5 bg-primary-600 text-white rounded-2xl font-semibold text-[15px] hover:bg-primary-700 active:scale-[0.98] transition-all"
          >
            <ArrowDownCircle className="w-5 h-5" />
            Déposer
          </button>
          <button
            onClick={() => setShowWithdraw(true)}
            className="flex-1 flex items-center justify-center gap-2.5 py-3.5 bg-white border border-gray-200 text-gray-900 rounded-2xl font-semibold text-[15px] hover:bg-gray-50 active:scale-[0.98] transition-all"
          >
            <ArrowUpCircle className="w-5 h-5" />
            Retirer
          </button>
        </div>

        {/* Transactions */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Historique</h2>
          {loadingTx ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-center text-gray-300 py-8 text-sm">Aucune transaction</p>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
              {transactions.map((tx) => {
                const isPositive = Number(tx.montant) > 0;
                return (
                  <div key={tx.id} className="flex items-center justify-between px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isPositive ? "bg-emerald-50" : "bg-red-50"}`}>
                        {isPositive ? <ArrowDownCircle className="w-4 h-4 text-emerald-500" /> : <ArrowUpCircle className="w-4 h-4 text-red-400" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                        <p className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
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

  // ── Vue principale : néobanque premium ──
  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* ── Solde principal ── */}
      <div className="text-center pt-2 pb-2">
        <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-3">Épargne totale</p>
        <div className="space-y-1">
          {epargnes.filter(e => e.devise !== "USD").length > 0 ? (
            <p className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
              {formatDevise(epargnes.filter(e => e.devise !== "USD").reduce((sum, e) => sum + Number(e.solde), 0), "EUR")}
            </p>
          ) : (
            <p className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">0,00 €</p>
          )}
          {epargnes.filter(e => e.devise === "USD").length > 0 && (
            <p className="text-xl font-semibold text-gray-400">
              {formatDevise(epargnes.filter(e => e.devise === "USD").reduce((sum, e) => sum + Number(e.solde), 0), "USD")}
            </p>
          )}
        </div>
        <p className="text-sm text-gray-400 mt-2">{epargnes.length} compte{epargnes.length !== 1 ? "s" : ""} actif{epargnes.length !== 1 ? "s" : ""}</p>
      </div>

      {/* ── Actions principales ── */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            if (epargnes.length > 0) setSelectedEpargne(epargnes[0]);
            if (epargnes.length > 0) setShowDeposit(true);
          }}
          disabled={epargnes.length === 0}
          className="flex-1 flex items-center justify-center gap-2.5 py-3.5 bg-primary-600 text-white rounded-2xl font-semibold text-[15px] hover:bg-primary-700 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowDownCircle className="w-5 h-5" />
          Déposer
        </button>
        <button
          onClick={() => setShowCreate(true)}
          className="flex-1 flex items-center justify-center gap-2.5 py-3.5 bg-white border border-gray-200 text-gray-900 rounded-2xl font-semibold text-[15px] hover:bg-gray-50 active:scale-[0.98] transition-all"
        >
          <Plus className="w-5 h-5" />
          Nouvelle épargne
        </button>
      </div>

      {/* ── Mes comptes ── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Mes comptes</h2>

        {epargnes.length === 0 ? (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full group bg-white rounded-2xl border border-dashed border-gray-200 hover:border-primary-300 p-8 text-center transition-all"
          >
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-50 transition-colors">
              <PiggyBank className="w-7 h-7 text-gray-300 group-hover:text-primary-500 transition-colors" />
            </div>
            <p className="font-semibold text-gray-900 mb-1">Créez votre premier compte</p>
            <p className="text-sm text-gray-400">Commencez à épargner pour vos projets</p>
          </button>
        ) : (
          <div className="space-y-3">
            {epargnes.map((ep) => {
              const progress = ep.objectif_montant ? Math.min((Number(ep.solde) / Number(ep.objectif_montant)) * 100, 100) : 0;
              const isProgrammee = ep.type === "programmee";
              const isObjectif = ep.type === "objectif";

              return (
                <button
                  key={ep.id}
                  onClick={() => setSelectedEpargne(ep)}
                  className="w-full group flex items-center gap-4 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 p-4 sm:p-5 active:scale-[0.99] transition-all text-left"
                >
                  {/* Icône */}
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl"
                    style={{ backgroundColor: (ep.couleur || "#6366f1") + "12" }}
                  >
                    {ep.icone}
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate pr-2">{ep.nom}</h3>
                      <span className="text-lg font-bold text-gray-900 flex-shrink-0">{formatDevise(Number(ep.solde), ep.devise)}</span>
                    </div>

                    {isObjectif && ep.objectif_montant ? (
                      <div>
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                          <span>Objectif {formatDevise(Number(ep.objectif_montant), ep.devise)}</span>
                          <span className="font-semibold" style={{ color: ep.couleur }}>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${progress}%`, backgroundColor: ep.couleur || "#6366f1" }}
                          />
                        </div>
                      </div>
                    ) : isProgrammee && ep.montant_auto ? (
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDevise(Number(ep.montant_auto), ep.devise)} / {ep.frequence_auto === "quotidien" ? "jour" : ep.frequence_auto === "hebdomadaire" ? "semaine" : "mois"}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">Épargne libre</p>
                    )}
                  </div>

                  {/* Chevron */}
                  <ChevronLeft className="w-4 h-4 text-gray-300 rotate-180 flex-shrink-0 group-hover:text-gray-500 transition-colors" />
                </button>
              );
            })}

            {/* Créer un compte — compact */}
            <button
              onClick={() => setShowCreate(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-gray-400 hover:text-primary-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Créer un nouveau compte
            </button>
          </div>
        )}
      </div>

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">Nouveau compte d&apos;épargne</h2>
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
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
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
                    type === t.value ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:border-gray-300"
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
                    devise === d.value ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:border-gray-300"
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
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date limite</label>
                <input
                  type="date"
                  value={objectifDate}
                  onChange={(e) => setObjectifDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Fréquence</label>
                  <select
                    value={frequenceAuto}
                    onChange={(e) => setFrequenceAuto(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
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
                      sourceAuto === "wallet" ? "border-primary-500 bg-primary-50" : "border-gray-200"
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    <span className="text-sm font-medium">Portefeuille</span>
                  </button>
                  <button
                    onClick={() => setSourceAuto("carte")}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      sourceAuto === "carte" ? "border-primary-500 bg-primary-50" : "border-gray-200"
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
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
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
                      icone === ic ? "bg-primary-100 ring-2 ring-primary-500" : "bg-gray-50 hover:bg-gray-100"
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
                      couleur === c ? "ring-2 ring-offset-2 ring-primary-500" : ""
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
            className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
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
          className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">Déposer sur {epargne.nom}</h2>
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-lg font-semibold"
                />
              </div>

              {/* Source */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Source</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSource("depot_wallet")}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      source === "depot_wallet" ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Wallet className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium">Portefeuille</span>
                  </button>
                  <button
                    onClick={() => setSource("depot_carte")}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      source === "depot_carte" ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:border-gray-300"
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
                              selectedCardId === carte.id ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                              selectedCardId === carte.id ? "bg-primary-100" : "bg-gray-100"
                            }`}>
                              <CreditCard className="w-5 h-5 text-gray-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{brandIcon(carte.marque)}</p>
                              <p className="text-xs text-gray-500">•••• {carte.last4} — Exp. {String(carte.exp_month).padStart(2, "0")}/{carte.exp_year}</p>
                            </div>
                            {selectedCardId === carte.id && (
                              <CheckCircle2 className="w-5 h-5 text-primary-600" />
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
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-300 text-sm font-medium text-gray-600 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/50 transition-all"
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
              className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">Retirer de {epargne.nom}</h2>
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
                      destination === "retrait" ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:border-gray-300"
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
                      destination === "retrait_banque" ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:border-gray-300"
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-lg font-semibold"
                />
              </div>
              <button
                onClick={() => setMontant(String(Number(epargne.solde)))}
                className="text-sm text-primary-600 font-medium hover:underline"
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
