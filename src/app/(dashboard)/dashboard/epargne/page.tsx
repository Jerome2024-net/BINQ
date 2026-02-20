"use client";

import { useState, useEffect, useCallback } from "react";
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
  Gift,
  Lock,
  Wallet,
  CreditCard,
  Trash2,
} from "lucide-react";

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
  bonus_cumule: number;
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

function formatXOF(montant: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "decimal", maximumFractionDigits: 0 }).format(montant) + " F CFA";
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
  const totalBonus = epargnes.reduce((sum, e) => sum + Number(e.bonus_cumule), 0);

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
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Solde actuel</p>
          <p className="text-3xl font-bold text-gray-900">{formatXOF(Number(ep.solde))}</p>

          {ep.type === "objectif" && ep.objectif_montant && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>Progression</span>
                <span>{Math.round(progress)}% — Objectif {formatXOF(Number(ep.objectif_montant))}</span>
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
                {formatXOF(Number(ep.montant_auto))} / {ep.frequence_auto === "quotidien" ? "jour" : ep.frequence_auto === "hebdomadaire" ? "semaine" : "mois"}
              </div>
              {Number(ep.bonus_cumule) > 0 && (
                <div className="flex items-center gap-2 text-sm bg-green-50 px-3 py-1.5 rounded-lg text-green-700">
                  <Gift className="w-4 h-4" />
                  Bonus cumulé : {formatXOF(Number(ep.bonus_cumule))}
                </div>
              )}
            </div>
          )}

          {ep.bloque_jusqu_a && new Date(ep.bloque_jusqu_a) > new Date() && (
            <div className="mt-3 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg">
              <Lock className="w-4 h-4" />
              Bloquée jusqu&apos;au {new Date(ep.bloque_jusqu_a).toLocaleDateString("fr-FR")}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
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
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
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
                      {isPositive ? "+" : ""}{formatXOF(Number(tx.montant))}
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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Épargne</h1>
          <p className="text-sm text-gray-500 mt-1">Gérez vos comptes d&apos;épargne individuelle</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-5 h-5" />
          Nouveau compte
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-sm text-gray-500">Total épargné</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatXOF(totalEpargne)}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Bonus cumulés</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatXOF(totalBonus)}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Comptes actifs</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{epargnes.length}</p>
        </div>
      </div>

      {/* Liste */}
      {epargnes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <PiggyBank className="w-8 h-8 text-indigo-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Commencez à épargner</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Créez votre premier compte d&apos;épargne et commencez à mettre de l&apos;argent de côté pour vos projets.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Créer un compte
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {epargnes.map((ep) => {
            const progress = ep.objectif_montant ? Math.min((Number(ep.solde) / Number(ep.objectif_montant)) * 100, 100) : 0;
            return (
              <button
                key={ep.id}
                onClick={() => setSelectedEpargne(ep)}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-gray-200 transition-all text-left group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: ep.couleur + "20" }}>
                      {ep.icone}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{ep.nom}</h3>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: ep.couleur + "15", color: ep.couleur }}>
                        {ep.type === "libre" ? "Libre" : ep.type === "objectif" ? "Objectif" : "Programmée"}
                      </span>
                    </div>
                  </div>
                  {ep.bloque_jusqu_a && new Date(ep.bloque_jusqu_a) > new Date() && (
                    <Lock className="w-4 h-4 text-amber-500" />
                  )}
                </div>

                <p className="text-xl font-bold text-gray-900 mb-1">{formatXOF(Number(ep.solde))}</p>

                {ep.type === "objectif" && ep.objectif_montant && (
                  <div className="mt-2">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: ep.couleur }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{Math.round(progress)}% de {formatXOF(Number(ep.objectif_montant))}</p>
                  </div>
                )}

                {ep.type === "programmee" && ep.montant_auto && (
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatXOF(Number(ep.montant_auto))} / {ep.frequence_auto === "quotidien" ? "jour" : ep.frequence_auto === "hebdomadaire" ? "semaine" : "mois"}
                  </p>
                )}
              </button>
            );
          })}
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
                { value: "programmee", label: "Programmée", desc: "+1%/an" },
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

          {/* Objectif */}
          {type === "objectif" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Montant objectif (F CFA)</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Montant auto (F CFA)</label>
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

  const handleDeposit = async () => {
    const m = Number(montant);
    if (!m || m <= 0) {
      setError("Montant invalide");
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Déposer sur {epargne.nom}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Montant (F CFA)</label>
            <input
              type="number"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              placeholder="10 000"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-lg font-semibold"
            />
          </div>

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
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-semibold text-gray-600 hover:bg-gray-50">
            Annuler
          </button>
          <button
            onClick={handleDeposit}
            disabled={actionLoading}
            className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowDownCircle className="w-5 h-5" />}
            Déposer
          </button>
        </div>
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
          type: "retrait",
          montant: m,
          description: "Retrait vers portefeuille",
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Montant (F CFA) — Disponible : {formatXOF(Number(epargne.solde))}
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
