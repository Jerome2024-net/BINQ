"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
  Users,
  Plus,
  X,
  ArrowLeft,
  Copy,
  Check,
  Send,
  TrendingUp,
  Crown,
  UserPlus,
  Wallet,
  ArrowDownToLine,
  Share2,
  Target,
  Clock,
  ChevronRight,
  Loader2,
  MessageCircle,
  Mail,
  SplitSquareHorizontal,
  Trash2,
  Camera,
  Gift,
  Plane,
  Home,
  Heart,
  GraduationCap,
  PartyPopper,
  Globe,
  Trophy,
  Music,
  UtensilsCrossed,
} from "lucide-react";

// ══════════════════════════════════
// TYPES
// ══════════════════════════════════
interface Membre {
  id: string;
  user_id: string;
  role: string;
  total_contribue: number;
  joined_at: string;
  profiles?: {
    prenom: string;
    nom: string;
    avatar_url: string | null;
    email: string;
  };
}

interface Contribution {
  id: string;
  user_id: string;
  montant: number;
  message: string | null;
  type: string;
  created_at: string;
  profiles?: {
    prenom: string;
    nom: string;
  };
}

interface Cagnotte {
  id: string;
  createur_id: string;
  nom: string;
  description: string | null;
  objectif_montant: number | null;
  date_limite: string | null;
  devise: string;
  icone: string;
  couleur: string;
  code_invitation: string;
  visibilite_montants: boolean;
  solde: number;
  statut: string;
  mon_role?: string;
  nombre_membres?: number;
  image_url?: string | null;
  created_at: string;
  cagnotte_membres?: Membre[];
  cagnotte_contributions?: Contribution[];
}

// ══════════════════════════════════
// CONSTANTES & HELPERS
// ══════════════════════════════════
const ICONE_OPTIONS = [
  { id: "target", label: "Objectif" },
  { id: "gift", label: "Cadeau" },
  { id: "plane", label: "Voyage" },
  { id: "home", label: "Maison" },
  { id: "heart", label: "Amour" },
  { id: "graduation", label: "Études" },
  { id: "party", label: "Fête" },
  { id: "globe", label: "Monde" },
  { id: "trophy", label: "Sport" },
  { id: "music", label: "Musique" },
  { id: "food", label: "Repas" },
  { id: "users", label: "Groupe" },
];

const ICONE_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  target: Target,
  gift: Gift,
  plane: Plane,
  home: Home,
  heart: Heart,
  graduation: GraduationCap,
  party: PartyPopper,
  globe: Globe,
  trophy: Trophy,
  music: Music,
  food: UtensilsCrossed,
  users: Users,
};

function getIconForCagnotte(icone: string): React.ComponentType<{ className?: string }> {
  return ICONE_MAP[icone] || Target;
}

const COULEURS = [
  "#18181b", "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6",
];

function formatMontant(montant: number, devise: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: devise || "EUR",
    minimumFractionDigits: 2,
  }).format(montant);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateHeure(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ══════════════════════════════════
// PAGE PRINCIPALE
// ══════════════════════════════════
export default function CagnottesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [cagnottes, setCagnottes] = useState<Cagnotte[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [selectedCagnotte, setSelectedCagnotte] = useState<Cagnotte | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const charger = async () => {
    try {
      const res = await fetch("/api/cagnottes");
      const data = await res.json();
      if (res.ok) setCagnottes(data.cagnottes || []);
    } catch {
      showToast("error", "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ouvrirDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/cagnottes/${id}`);
      const data = await res.json();
      if (res.ok) {
        const cagnotte = data.cagnotte;
        if (user) {
          const membre = cagnotte.cagnotte_membres?.find(
            (m: Membre) => m.user_id === user.id
          );
          cagnotte.mon_role = membre?.role || "membre";
        }
        setSelectedCagnotte(cagnotte);
      }
    } catch {
      showToast("error", "Impossible d'ouvrir la cagnotte");
    } finally {
      setDetailLoading(false);
    }
  };

  if (selectedCagnotte) {
    return (
      <CagnotteDetail
        cagnotte={selectedCagnotte}
        userId={user?.id || ""}
        onBack={() => setSelectedCagnotte(null)}
        onRefresh={() => ouvrirDetail(selectedCagnotte.id)}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cagnottes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Collectez et contribuez ensemble en temps réel
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Créer
        </button>
        <button
          onClick={() => setShowJoin(true)}
          className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Rejoindre
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* Empty */}
      {!loading && cagnottes.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Aucune cagnotte
          </h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            Créez une cagnotte pour collecter de l&apos;argent ensemble ou rejoignez-en une avec un code.
          </p>
        </div>
      )}

      {/* Liste */}
      {!loading && cagnottes.length > 0 && (
        <div className="space-y-3">
          {cagnottes.map((cagnotte) => {
            const Icon = getIconForCagnotte(cagnotte.icone);
            const progress =
              cagnotte.objectif_montant && cagnotte.objectif_montant > 0
                ? Math.min(100, Math.round((Number(cagnotte.solde) / cagnotte.objectif_montant) * 100))
                : null;

            return (
              <button
                key={cagnotte.id}
                onClick={() => ouvrirDetail(cagnotte.id)}
                disabled={detailLoading}
                className="w-full bg-white rounded-2xl border border-gray-200 hover:border-gray-300 transition-colors p-4 text-left"
              >
                <div className="flex items-center gap-4">
                  {/* Icon / Image */}
                  <div className="flex-shrink-0">
                    {cagnotte.image_url ? (
                      <img
                        src={cagnotte.image_url}
                        alt={cagnotte.nom}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-gray-500" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 truncate text-sm">
                        {cagnotte.nom}
                      </p>
                      {cagnotte.mon_role === "admin" && (
                        <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {cagnotte.nombre_membres || 1}
                      </span>
                      {cagnotte.date_limite && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(cagnotte.date_limite)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Montant */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold text-gray-900">
                      {formatMontant(Number(cagnotte.solde), cagnotte.devise)}
                    </p>
                    {cagnotte.objectif_montant && (
                      <p className="text-[11px] text-gray-400">
                        / {formatMontant(cagnotte.objectif_montant, cagnotte.devise)}
                      </p>
                    )}
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </div>

                {/* Progress */}
                {progress !== null && (
                  <div className="mt-3">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-900 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1 text-right">{progress}%</p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <CreateCagnotteModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            charger();
            showToast("success", "Cagnotte créée !");
          }}
        />
      )}
      {showJoin && (
        <JoinCagnotteModal
          onClose={() => setShowJoin(false)}
          onSuccess={(id) => {
            setShowJoin(false);
            charger();
            ouvrirDetail(id);
            showToast("success", "Vous avez rejoint la cagnotte !");
          }}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════
// VUE DÉTAIL
// ══════════════════════════════════
function CagnotteDetail({
  cagnotte,
  userId,
  onBack,
  onRefresh,
}: {
  cagnotte: Cagnotte;
  userId: string;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const { showToast } = useToast();
  const [showContrib, setShowContrib] = useState(false);
  const [showRetrait, setShowRetrait] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = cagnotte.mon_role === "admin";
  const membres = cagnotte.cagnotte_membres || [];
  const contributions = cagnotte.cagnotte_contributions || [];
  const progress =
    cagnotte.objectif_montant && cagnotte.objectif_montant > 0
      ? Math.min(100, Math.round((Number(cagnotte.solde) / cagnotte.objectif_montant) * 100))
      : null;

  const supprimerCagnotte = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/cagnottes/${cagnotte.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("success", "Cagnotte supprimée");
      onBack();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Erreur");
    } finally {
      setDeleting(false);
    }
  };

  const copierCode = async () => {
    await navigator.clipboard.writeText(cagnotte.code_invitation);
    showToast("success", "Code copié !");
  };

  const Icon = getIconForCagnotte(cagnotte.icone);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            {cagnotte.image_url ? (
              <img
                src={cagnotte.image_url}
                alt={cagnotte.nom}
                className="w-14 h-14 rounded-xl object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center">
                <Icon className="w-6 h-6 text-gray-500" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{cagnotte.nom}</h1>
              {cagnotte.description && (
                <p className="text-sm text-gray-500 mt-0.5">{cagnotte.description}</p>
              )}
            </div>
          </div>
          {isAdmin && (
            <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
              Admin
            </span>
          )}
        </div>

        {/* Solde */}
        <div className="text-center py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
            Solde collecté
          </p>
          <p className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            {formatMontant(Number(cagnotte.solde), cagnotte.devise)}
          </p>
        </div>

        {/* Progress */}
        {progress !== null && cagnotte.objectif_montant && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>{progress}% atteint</span>
              <span>
                Objectif : {formatMontant(cagnotte.objectif_montant, cagnotte.devise)}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-900 rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Users className="w-3.5 h-3.5" />
            {membres.length} membre{membres.length > 1 ? "s" : ""}
          </div>
          {cagnotte.date_limite && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              Jusqu&apos;au {formatDate(cagnotte.date_limite)}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <TrendingUp className="w-3.5 h-3.5" />
            {contributions.filter((c) => c.type === "contribution").length} contribution
            {contributions.filter((c) => c.type === "contribution").length > 1 ? "s" : ""}
          </div>
          <button
            onClick={copierCode}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors ml-auto"
          >
            <Copy className="w-3.5 h-3.5" />
            {cagnotte.code_invitation}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setShowContrib(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
        >
          <Send className="w-4 h-4" />
          Contribuer
        </button>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          Inviter
        </button>
        {isAdmin && Number(cagnotte.solde) > 0 && (
          <button
            onClick={() => setShowRetrait(true)}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowDownToLine className="w-4 h-4" />
            Retirer
          </button>
        )}
        {isAdmin && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-5 py-2.5 border border-red-200 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors ml-auto"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Confirmation suppression */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 mx-auto rounded-full bg-red-50 flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-center text-gray-900">
              Supprimer cette cagnotte ?
            </h3>
            <p className="text-sm text-gray-500 text-center">
              {Number(cagnotte.solde) > 0
                ? "Vous devez d'abord retirer tout le solde avant de supprimer."
                : "Cette action est irréversible. La cagnotte et tout son historique seront supprimés."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={supprimerCagnotte}
                disabled={deleting || Number(cagnotte.solde) > 0}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {deleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Membres */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Membres ({membres.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {membres.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-5 py-3.5">
              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                {m.profiles?.prenom?.[0]?.toUpperCase() || "?"}
                {m.profiles?.nom?.[0]?.toUpperCase() || ""}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {m.profiles?.prenom || ""} {m.profiles?.nom || ""}
                  </p>
                  {m.role === "admin" && (
                    <Crown className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  )}
                  {m.user_id === userId && (
                    <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                      Vous
                    </span>
                  )}
                </div>
                {cagnotte.visibilite_montants && (
                  <p className="text-xs text-gray-400">
                    {formatMontant(Number(m.total_contribue), cagnotte.devise)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historique */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Activité
          </h2>
        </div>
        {contributions.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">
            Aucune activité pour le moment
          </p>
        ) : (
          <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
            {contributions.map((c) => {
              const isContrib = c.type === "contribution";
              return (
                <div key={c.id} className="flex items-start gap-3 px-5 py-3.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isContrib ? "bg-gray-100" : "bg-red-50"
                    }`}
                  >
                    {isContrib ? (
                      <TrendingUp className="w-3.5 h-3.5 text-gray-500" />
                    ) : (
                      <ArrowDownToLine className="w-3.5 h-3.5 text-red-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {c.profiles?.prenom || ""} {c.profiles?.nom || ""}
                      </p>
                      <span
                        className={`text-sm font-bold whitespace-nowrap ${
                          isContrib ? "text-gray-900" : "text-red-500"
                        }`}
                      >
                        {isContrib ? "+" : "-"}
                        {formatMontant(Number(c.montant), cagnotte.devise)}
                      </span>
                    </div>
                    {c.message && (
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {c.message}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1">
                      {formatDateHeure(c.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {showContrib && (
        <ContribuerModal
          cagnotteId={cagnotte.id}
          devise={cagnotte.devise}
          onClose={() => setShowContrib(false)}
          onSuccess={() => {
            setShowContrib(false);
            onRefresh();
            showToast("success", "Contribution enregistrée !");
          }}
        />
      )}
      {showRetrait && (
        <RetirerModal
          cagnotteId={cagnotte.id}
          solde={Number(cagnotte.solde)}
          devise={cagnotte.devise}
          onClose={() => setShowRetrait(false)}
          onSuccess={() => {
            setShowRetrait(false);
            onRefresh();
            showToast("success", "Retrait effectué !");
          }}
        />
      )}
      {showInvite && (
        <InvitationModal
          code={cagnotte.code_invitation}
          nom={cagnotte.nom}
          onClose={() => setShowInvite(false)}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════
// MODAL INVITATION
// ══════════════════════════════════
function InvitationModal({
  code,
  nom,
  onClose,
}: {
  code: string;
  nom: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const lien =
    typeof window !== "undefined"
      ? `${window.location.origin}/cagnotte/rejoindre/${code}`
      : "";

  const copierLien = async () => {
    await navigator.clipboard.writeText(lien);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const message = `Rejoins ma cagnotte "${nom}" sur Binq !\n${lien}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(
    `Rejoins la cagnotte "${nom}" sur Binq`
  )}&body=${encodeURIComponent(message)}`;

  const partagerNatif = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Cagnotte ${nom}`, text: message, url: lien });
      } catch {}
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Inviter des amis</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <p className="text-sm text-gray-500">
          Partagez ce lien pour inviter vos amis à rejoindre la cagnotte{" "}
          <strong>{nom}</strong>.
        </p>

        {/* Lien copiable */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <input
            type="text"
            readOnly
            value={lien}
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none truncate"
          />
          <button
            onClick={copierLien}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              copied
                ? "bg-gray-200 text-gray-700"
                : "bg-gray-900 text-white hover:bg-gray-800"
            }`}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copied ? "Copié" : "Copier"}
          </button>
        </div>

        {/* Code d'invitation */}
        <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-xs text-gray-400 mb-1">Code d&apos;invitation</p>
          <p className="text-xl font-mono font-bold text-gray-900 tracking-wider">
            {code}
          </p>
        </div>

        {/* Boutons de partage */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp
          </a>
          <a
            href={emailUrl}
            className="flex items-center justify-center gap-2 py-3 bg-gray-700 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition"
          >
            <Mail className="w-5 h-5" />
            Email
          </a>
          <a
            href={smsUrl}
            className="flex items-center justify-center gap-2 py-3 bg-gray-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition"
          >
            <MessageCircle className="w-5 h-5" />
            SMS
          </a>
          {typeof navigator !== "undefined" &&
            typeof navigator.share === "function" && (
              <button
                onClick={partagerNatif}
                className="flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition"
              >
                <Share2 className="w-5 h-5" />
                Partager
              </button>
            )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════
// MODAL CRÉER
// ══════════════════════════════════
function CreateCagnotteModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [objectifMontant, setObjectifMontant] = useState("");
  const [dateLimite, setDateLimite] = useState("");
  const [devise, setDevise] = useState<"EUR" | "USD">("EUR");
  const [icone, setIcone] = useState("target");
  const [couleur, setCouleur] = useState("#18181b");
  const [visibilite, setVisibilite] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (cagnotteId: string): Promise<string | null> => {
    if (!imageFile) return null;
    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("cagnotteId", cagnotteId);
    try {
      const res = await fetch("/api/cagnottes/upload-image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) return data.url;
    } catch {}
    return null;
  };

  const handleSubmit = async () => {
    if (!nom.trim()) {
      setError("Nom requis");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/cagnottes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom,
          description,
          objectif_montant: objectifMontant ? Number(objectifMontant) : null,
          date_limite: dateLimite || null,
          devise,
          icone,
          couleur,
          visibilite_montants: visibilite,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (imageFile && data.cagnotte?.id) {
        await uploadImage(data.cagnotte.id);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Nouvelle cagnotte</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Photo */}
          <div className="flex flex-col items-center">
            <label className="block text-sm font-medium text-gray-700 mb-2 self-start">
              Photo (optionnel)
            </label>
            <div
              className="relative group cursor-pointer"
              onClick={() =>
                document.getElementById("cagnotte-image-input")?.click()
              }
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-gray-200 group-hover:border-gray-400 transition-colors"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 group-hover:border-gray-400 flex flex-col items-center justify-center gap-1 transition-colors bg-gray-50">
                  <Camera className="w-6 h-6 text-gray-400 group-hover:text-gray-600" />
                  <span className="text-[10px] text-gray-400 group-hover:text-gray-600">
                    Ajouter
                  </span>
                </div>
              )}
              <input
                id="cagnotte-image-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nom de la cagnotte
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Anniversaire de Marie, Voyage Espagne..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 outline-none text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description (optionnel)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez l'objectif de cette cagnotte..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 outline-none text-sm resize-none h-20"
            />
          </div>

          {/* Objectif + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Objectif (optionnel)
              </label>
              <input
                type="number"
                value={objectifMontant}
                onChange={(e) => setObjectifMontant(e.target.value)}
                placeholder="500"
                min="0"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Date limite (optionnel)
              </label>
              <input
                type="date"
                value={dateLimite}
                onChange={(e) => setDateLimite(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 outline-none text-sm"
              />
            </div>
          </div>

          {/* Devise */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Devise
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["EUR", "EUR €", "Euro"],
                  ["USD", "USD $", "Dollar"],
                ] as const
              ).map(([val, label, desc]) => (
                <button
                  key={val}
                  onClick={() => setDevise(val)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    devise === val
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Icône */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Icône
            </label>
            <div className="flex flex-wrap gap-2">
              {ICONE_OPTIONS.map((opt) => {
                const OptIcon = ICONE_MAP[opt.id] || Target;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setIcone(opt.id)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      icone === opt.id
                        ? "bg-gray-900 text-white ring-2 ring-gray-900 ring-offset-1"
                        : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                    }`}
                    title={opt.label}
                  >
                    <OptIcon className="w-4.5 h-4.5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Couleur */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Couleur
            </label>
            <div className="flex flex-wrap gap-2">
              {COULEURS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCouleur(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    couleur === c
                      ? "ring-2 ring-offset-2 ring-gray-900 scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Visibilité */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Montants visibles
              </p>
              <p className="text-xs text-gray-500">
                Les membres voient combien chacun a contribué
              </p>
            </div>
            <button
              onClick={() => setVisibilite(!visibilite)}
              className={`w-12 h-7 rounded-full transition-colors relative ${
                visibilite ? "bg-gray-900" : "bg-gray-300"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${
                  visibilite ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            {loading ? "Création..." : "Créer la cagnotte"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════
// MODAL REJOINDRE
// ══════════════════════════════════
function JoinCagnotteModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (id: string) => void;
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async () => {
    if (!code.trim()) {
      setError("Entrez un code");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/cagnottes/rejoindre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSuccess(data.cagnotte_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            Rejoindre une cagnotte
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Code d&apos;invitation
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ex: AB12CD34"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 outline-none text-center text-lg font-mono font-bold tracking-widest uppercase"
              maxLength={8}
            />
          </div>
          <button
            onClick={handleJoin}
            disabled={loading}
            className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <UserPlus className="w-5 h-5" />
            )}
            {loading ? "En cours..." : "Rejoindre"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════
// MODAL CONTRIBUER
// ══════════════════════════════════
function ContribuerModal({
  cagnotteId,
  devise,
  onClose,
  onSuccess,
}: {
  cagnotteId: string;
  devise: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [montant, setMontant] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const deviseSymbol = devise === "USD" ? "$" : "€";
  const montantsRapides = [5, 10, 25, 50, 100];

  const handleContrib = async () => {
    const m = Number(montant);
    if (!m || m <= 0) {
      setError("Montant invalide");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/cagnottes/${cagnotteId}/contribuer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ montant: m, message }),
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
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Contribuer</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="text-center py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
              Montant
            </p>
            <div className="flex items-center justify-center gap-2">
              <input
                type="number"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                placeholder="0"
                className="w-40 text-center text-4xl font-bold text-gray-900 border-none outline-none bg-transparent"
              />
              <span className="text-2xl font-bold text-gray-300">
                {deviseSymbol}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {montantsRapides.map((m) => (
              <button
                key={m}
                onClick={() => setMontant(String(m))}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  montant === String(m)
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {m} {deviseSymbol}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Message (optionnel)
            </label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Un petit mot..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 outline-none text-sm"
            />
          </div>

          <p className="text-xs text-center text-gray-400">
            Le montant sera débité de votre portefeuille Binq
          </p>

          <button
            onClick={handleContrib}
            disabled={loading}
            className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            {loading
              ? "En cours..."
              : `Envoyer ${montant ? `${montant} ${deviseSymbol}` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════
// MODAL RETIRER (admin)
// ══════════════════════════════════
function RetirerModal({
  cagnotteId,
  solde,
  devise,
  onClose,
  onSuccess,
}: {
  cagnotteId: string;
  solde: number;
  devise: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [destination, setDestination] = useState<"wallet" | "repartir">(
    "wallet"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRetrait = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/cagnottes/${cagnotteId}/retirer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ montant: solde, destination }),
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
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Retirer les fonds</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
              Montant disponible
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {formatMontant(solde, devise)}
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Destination
            </label>
            <button
              onClick={() => setDestination("wallet")}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                destination === "wallet"
                  ? "border-gray-900 bg-gray-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Wallet className="w-5 h-5 text-gray-700" />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Mon portefeuille
                </p>
                <p className="text-xs text-gray-500">
                  Tout le montant va dans votre portefeuille
                </p>
              </div>
            </button>
            <button
              onClick={() => setDestination("repartir")}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                destination === "repartir"
                  ? "border-gray-900 bg-gray-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <SplitSquareHorizontal className="w-5 h-5 text-gray-700" />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Répartir entre tous
                </p>
                <p className="text-xs text-gray-500">
                  Chaque membre reçoit une part égale
                </p>
              </div>
            </button>
          </div>

          <button
            onClick={handleRetrait}
            disabled={loading}
            className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ArrowDownToLine className="w-5 h-5" />
            )}
            {loading ? "En cours..." : "Confirmer le retrait"}
          </button>
        </div>
      </div>
    </div>
  );
}
