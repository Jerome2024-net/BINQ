"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTontine } from "@/contexts/TontineContext";
import { useToast } from "@/contexts/ToastContext";
import { useFinance } from "@/contexts/FinanceContext";
import { usePayment } from "@/contexts/PaymentContext";
import StripeCotisationModal from "@/components/StripeCotisationModal";
import InviteModal from "@/components/InviteModal";
import ConfirmModal from "@/components/ConfirmModal";
import TontineProfileCard from "@/components/TontineProfileCard";
import OrganizerProfileCard from "@/components/OrganizerProfileCard";
import ParticipantProfileCard from "@/components/ParticipantProfileCard";
import { TontineDetailSkeleton } from "@/components/Skeleton";
import {
  Users,
  CircleDollarSign,
  Calendar,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  Smartphone,
  CreditCard,
  Building,
  UserCircle,
  Crown,
  Play,
  Trash2,
  LogOut,
  UserPlus,
  LayoutDashboard,
  User as UserIcon,
  UsersRound,
  XCircle,
  Ban,
  ShieldAlert,
  Mail,
} from "lucide-react";
import { formatMontant, formatDate, getStatutLabel, getStatutColor } from "@/lib/data";

type TabKey = "profil" | "tours" | "organisateur" | "participants";

function getMethodeIcon(methode: string) {
  switch (methode) {
    case "virement":
      return <Building className="w-4 h-4" />;
    case "carte":
      return <CreditCard className="w-4 h-4" />;
    case "stripe":
      return <CreditCard className="w-4 h-4" />;
    default:
      return <CircleDollarSign className="w-4 h-4" />;
  }
}

function getMethodeLabel(methode: string) {
  const labels: Record<string, string> = {
    virement: "Virement",
    carte: "Carte bancaire",
    stripe: "Stripe",
  };
  return labels[methode] || methode;
}

export default function TontineDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const { user } = useAuth();
  const { getTontineById, effectuerPaiement, inviterMembre, exclureMembre, demarrerTontine, supprimerTontine, quitterGroupe, rejoindreGroupe, signalerDefaillance, getInvitationsPourTontine, isLoading: tontineLoading } = useTontine();
  const { showToast } = useToast();
  const { payerCotisation, recevoirPot, getOrCreateWallet, rembourserCotisationAnnulation } = useFinance();
  const { distributePot, currency } = usePayment();

  const [activeTab, setActiveTab] = useState<TabKey>("profil");
  const [stripeCotisationModal, setStripeCotisationModal] = useState(false);
  const [inviteModal, setInviteModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmText: string;
    danger: boolean;
    action: () => void;
  }>({ open: false, title: "", message: "", confirmText: "", danger: false, action: () => {} });

  const tontine = getTontineById(id);

  if (tontineLoading) {
    return <TontineDetailSkeleton />;
  }

  if (!tontine) {
    return (
      <div className="space-y-6">
        <Link href="/tontines" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-600 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" />
          Retour aux tontines
        </Link>
        <div className="card text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Tontine introuvable</p>
          <Link href="/tontines" className="btn-primary mt-4 inline-block">Voir mes tontines</Link>
        </div>
      </div>
    );
  }

  const isOrganisateur = tontine.organisateur.id === user?.id || tontine.organisateur.email === user?.email;
  const isMembre = tontine.membres.some((m) => m.user.id === user?.id || m.user.email === user?.email);
  const tourEnCours = tontine.tours.find((t) => t.statut === "en_cours");

  const monPaiementEnAttente = tourEnCours?.paiements.find(
    (p) => p.statut === "en_attente" && (p.membre.id === user?.id || p.membre.email === user?.email)
  );

  // ========================
  // Paiement cotisation via Stripe (callback après succès)
  // ========================
  const handleStripePaymentSuccess = async (paymentIntentId: string) => {
    if (!tourEnCours) return;
    await getOrCreateWallet();

    // Enregistrer dans le contexte finance (suivi local)
    await payerCotisation(
      tontine.montantCotisation,
      tontine.id,
      tontine.nom,
      tourEnCours.id,
      tourEnCours.numero,
      "stripe"
    );

    // Enregistrer le paiement dans le contexte tontine
    const result = await effectuerPaiement(tontine.id, tourEnCours.id, "stripe");
    if (result.success) {
      showToast("success", "Cotisation payée via Stripe ! ✅", "Référence: " + result.reference);

      // Vérifier si le tour est complet → distribuer le pot automatiquement
      const updatedTontine = getTontineById(tontine.id);
      const updatedTour = updatedTontine?.tours.find(t => t.id === tourEnCours.id);
      if (updatedTour && updatedTour.statut === "complete" && updatedTontine) {
        // Enregistrer la réception du pot localement
        await recevoirPot(updatedTour.montantTotal, updatedTontine.id, updatedTontine.nom, updatedTour.numero);

        // Tenter la distribution via Stripe Connect si le bénéficiaire a un compte
        const beneficiaireUser = updatedTour.beneficiaire;
        if (beneficiaireUser.stripeAccountId && beneficiaireUser.stripeChargesEnabled) {
          distributePot(
            updatedTour.montantTotal,
            currency,
            beneficiaireUser.stripeAccountId,
            updatedTontine.nom,
            updatedTour.numero
          );
        }
      }
    }
  };

  const handleInvite = async (email: string, telephone: string) => {
    const result = await inviterMembre(tontine.id, email, telephone);
    if (result.success) {
      showToast("success", "Invitation envoyée !", "Membre ajouté avec succès");
    }
    return result;
  };

  const handleDemarrer = () => {
    setConfirmModal({
      open: true,
      title: "Démarrer la tontine ?",
      message: "Voulez-vous démarrer \"" + tontine.nom + "\" ? Les tours seront créés automatiquement.",
      confirmText: "Démarrer",
      danger: false,
      action: async () => {
        await demarrerTontine(tontine.id);
        showToast("success", "Tontine démarrée !", "Les tours ont été créés");
      },
    });
  };

  const handleSupprimer = () => {
    setConfirmModal({
      open: true,
      title: "Supprimer la tontine ?",
      message: "Cette action est irréversible. La tontine et toutes les données associées seront supprimées.",
      confirmText: "Supprimer",
      danger: true,
      action: async () => {
        await supprimerTontine(tontine.id);
        showToast("success", "Tontine supprimée");
        router.push("/tontines");
      },
    });
  };

  const handleQuitter = () => {
    setConfirmModal({
      open: true,
      title: "Quitter la tontine ?",
      message: "Êtes-vous sûr de vouloir quitter cette tontine ?",
      confirmText: "Quitter",
      danger: true,
      action: async () => {
        await quitterGroupe(tontine.id);
        showToast("success", "Vous avez quitté la tontine");
        router.push("/tontines");
      },
    });
  };

  const handleRejoindre = async () => {
    const result = await rejoindreGroupe(tontine.id);
    if (result.success) {
      showToast("success", "Vous avez rejoint la tontine !");
    } else {
      showToast("error", "Erreur", result.error || "Impossible de rejoindre");
    }
  };

  const handleExclure = (membreId: string, membreNom: string) => {
    setConfirmModal({
      open: true,
      title: "Exclure ce membre ?",
      message: "Voulez-vous exclure " + membreNom + " de la tontine ?",
      confirmText: "Exclure",
      danger: true,
      action: async () => {
        await exclureMembre(tontine.id, membreId);
        showToast("success", membreNom + " a été exclu");
      },
    });
  };

  const handleDefaillance = (membreId: string, membreNom: string) => {
    setConfirmModal({
      open: true,
      title: "⚠️ Signaler défaillance ?",
      message: "ATTENTION : Signaler " + membreNom + " comme défaillant va ANNULER la tontine \"" + tontine.nom + "\" pour tous les membres. " + membreNom + " sera exclu et tous les autres membres seront remboursés. Cette action est irréversible.",
      confirmText: "Signaler défaillance",
      danger: true,
      action: async () => {
        const result = await signalerDefaillance(tontine.id, membreId);
        if (result.success) {
          // Rembourser les cotisations des membres non-défaillants
          const updatedTontine = getTontineById(tontine.id);
          if (updatedTontine) {
            const membresARembourser = updatedTontine.membres.filter(
              (m) => m.user.id !== membreId && m.statut !== "exclu"
            );
            let nbRembourses = 0;
            for (const _m of membresARembourser) {
              const refund = await rembourserCotisationAnnulation(
                updatedTontine.montantCotisation,
                updatedTontine.id,
                updatedTontine.nom,
                tourEnCours?.numero || 1
              );
              if (refund.success) nbRembourses++;
            }
          }
          showToast(
            "success",
            "Défaillance signalée",
            result.defaillantNom + " a été exclu. Tontine annulée. " + (result.membresRembourses || 0) + " membres seront remboursés."
          );
        } else {
          showToast("error", "Erreur", result.error || "Impossible de signaler la défaillance");
        }
      },
    });
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: "profil", label: "Profil Tontine", icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: "tours", label: "Tours", icon: <Calendar className="w-4 h-4" />, count: tontine.tours.length },
    { key: "organisateur", label: "Organisateur", icon: <Crown className="w-4 h-4" /> },
    { key: "participants", label: "Participants", icon: <UsersRound className="w-4 h-4" />, count: tontine.membres.length },
  ];

  return (
    <div className="space-y-6">
      {/* Back + Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link href="/tontines" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-600 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" />
          Retour aux tontines
        </Link>
        <div className="flex flex-wrap gap-2">
          {!isMembre && tontine.nombreMembres < tontine.membresMax && (
            <button onClick={handleRejoindre} className="btn-primary text-sm flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Rejoindre
            </button>
          )}
          {isOrganisateur && tontine.statut === "en_attente" && (
            <button onClick={handleDemarrer} className="btn-primary text-sm flex items-center gap-2">
              <Play className="w-4 h-4" />
              Démarrer
            </button>
          )}
          {isMembre && (
            <>
              <button onClick={() => setInviteModal(true)} className="btn-secondary text-sm flex items-center gap-2">
                <UserCircle className="w-4 h-4" />
                Inviter
              </button>
              {monPaiementEnAttente && (
                <button onClick={() => setStripeCotisationModal(true)} className="btn-primary text-sm flex items-center gap-2">
                  <CircleDollarSign className="w-4 h-4" />
                  Payer ma cotisation
                </button>
              )}
            </>
          )}
          {isMembre && !isOrganisateur && (
            <button onClick={handleQuitter} className="btn-secondary text-sm flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50">
              <LogOut className="w-4 h-4" />
              Quitter
            </button>
          )}
          {isOrganisateur && (
            <button onClick={handleSupprimer} className="btn-secondary text-sm flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50">
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 overflow-x-auto pb-px">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                  activeTab === tab.key ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-500"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Bannière d'annulation */}
      {tontine.statut === "annulee" && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-800 mb-1">❌ Tontine Annulée</h3>
              <p className="text-red-700 text-sm mb-3">{tontine.motifAnnulation}</p>
              <div className="flex flex-wrap gap-4 text-xs text-red-600">
                {tontine.dateAnnulation && (
                  <span>Annulée le {formatDate(tontine.dateAnnulation)}</span>
                )}
                {tontine.defaillantId && (
                  <span className="flex items-center gap-1">
                    <Ban className="w-3 h-3" />
                    Membre défaillant exclu
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === "profil" && (
        <TontineProfileCard tontine={tontine} isOrganisateur={isOrganisateur} />
      )}

      {activeTab === "organisateur" && (
        <OrganizerProfileCard organisateur={tontine.organisateur} tontine={tontine} />
      )}

      {activeTab === "participants" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <UsersRound className="w-5 h-5 text-primary-600" />
              Membres ({tontine.membres.length}/{tontine.membresMax})
            </h2>
            {tontine.nombreMembres < tontine.membresMax && isMembre && (
              <button onClick={() => setInviteModal(true)} className="btn-secondary text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Inviter
              </button>
            )}
          </div>

          {/* Organisateur en premier */}
          {[...tontine.membres]
            .sort((a, b) => (a.role === "organisateur" ? -1 : b.role === "organisateur" ? 1 : 0))
            .map((membre) => (
              <div key={membre.id} className="relative group">
                <ParticipantProfileCard membre={membre} tontine={tontine} />
                {isOrganisateur && membre.role !== "organisateur" && membre.statut !== "exclu" && tontine.statut === "active" && (
                  <div className="absolute top-3 right-3 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                    {tourEnCours && tourEnCours.paiements.some(p => (p.membre.id === membre.user.id || p.membre.email === membre.user.email) && p.statut === "en_attente") && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDefaillance(membre.user.id, membre.user.prenom + " " + membre.user.nom);
                        }}
                        className="p-1.5 text-orange-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                        title="Signaler défaillance (non-paiement)"
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleExclure(membre.id, membre.user.prenom + " " + membre.user.nom);
                      }}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Exclure"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}

          {/* Invitations en attente (visible par l'organisateur) */}
          {isOrganisateur && getInvitationsPourTontine(tontine.id).filter(i => i.statut === "en_attente").length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-500" />
                Invitations en attente ({getInvitationsPourTontine(tontine.id).filter(i => i.statut === "en_attente").length})
              </h3>
              <div className="space-y-2">
                {getInvitationsPourTontine(tontine.id)
                  .filter(i => i.statut === "en_attente")
                  .map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Mail className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">{inv.email}</p>
                          <p className="text-xs text-gray-400">Invité le {inv.dateCreation}</p>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-amber-600 bg-amber-50">
                        <Clock className="w-3 h-3" />
                        En attente
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "tours" && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            Planning des Tours
          </h2>

          {tontine.tours.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun tour planifié pour le moment</p>
              <p className="text-sm mt-1">
                {tontine.statut === "en_attente"
                  ? "Démarrez la tontine pour créer les tours automatiquement"
                  : "Les tours seront créés quand la tontine démarrera"}
              </p>
              {isOrganisateur && tontine.statut === "en_attente" && (
                <button onClick={handleDemarrer} className="btn-primary mt-4 text-sm inline-flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Démarrer la tontine
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {tontine.tours.map((tour) => {
                const nbConfirmes = tour.paiements.filter((p) => p.statut === "confirme").length;
                const totalAttendu = Math.max(1, tontine.nombreMembres - 1);
                const progression = Math.round((nbConfirmes / totalAttendu) * 100);

                return (
                  <div
                    key={tour.id}
                    className={`card ${
                      tour.statut === "en_cours"
                        ? "border-amber-200 bg-amber-50/30"
                        : tour.statut === "complete"
                        ? "border-green-200 bg-green-50/20"
                        : tour.statut === "annule"
                        ? "border-red-200 bg-red-50/20 opacity-60"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          tour.statut === "complete" ? "bg-green-100" : tour.statut === "en_cours" ? "bg-amber-100" : "bg-gray-100"
                        }`}>
                          {tour.statut === "complete" ? (
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                          ) : tour.statut === "en_cours" ? (
                            <AlertCircle className="w-6 h-6 text-amber-600" />
                          ) : (
                            <Clock className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Tour {tour.numero}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(tour.datePrevue)} · {formatMontant(tour.montantTotal, tontine.devise)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={getStatutColor(tour.statut)}>{getStatutLabel(tour.statut)}</span>
                      </div>
                    </div>

                    {/* Bénéficiaire */}
                    <div className="flex items-center gap-3 p-3 bg-white/80 rounded-xl mb-4 border border-gray-100">
                      <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-4 h-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Bénéficiaire</p>
                        <p className="text-sm font-semibold text-gray-900">{tour.beneficiaire.prenom} {tour.beneficiaire.nom}</p>
                      </div>
                    </div>

                    {tour.paiements.length > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-500">Paiements: {nbConfirmes}/{totalAttendu}</span>
                          <span className="text-xs font-bold text-primary-600">{progression}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                          <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${progression}%` }}></div>
                        </div>
                        <div className="space-y-2">
                          {tour.paiements.map((p) => (
                            <div key={p.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                              <div className="flex items-center gap-2">
                                {p.statut === "confirme" ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Clock className="w-4 h-4 text-amber-500" />
                                )}
                                <span className="text-gray-700">{p.membre.prenom} {p.membre.nom}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                {p.statut === "confirme" && (
                                  <span className="flex items-center gap-1 text-gray-400">
                                    {getMethodeIcon(p.methode)}
                                    <span className="text-xs">{getMethodeLabel(p.methode)}</span>
                                  </span>
                                )}
                                <span className={`font-medium ${p.statut === "confirme" ? "text-green-600" : "text-amber-600"}`}>
                                  {formatMontant(p.montant, tontine.devise)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <StripeCotisationModal
        isOpen={stripeCotisationModal}
        onClose={() => setStripeCotisationModal(false)}
        onPaymentSuccess={handleStripePaymentSuccess}
        tontineId={tontine.id}
        tontineNom={tontine.nom}
        tourId={tourEnCours?.id || ""}
        tourNumero={tourEnCours?.numero || 0}
        montant={tontine.montantCotisation}
        devise={tontine.devise}
        beneficiaire={tourEnCours ? tourEnCours.beneficiaire.prenom + " " + tourEnCours.beneficiaire.nom : ""}
      />

      <InviteModal
        isOpen={inviteModal}
        onClose={() => setInviteModal(false)}
        onInvite={handleInvite}
        tontineNom={tontine.nom}
        placesRestantes={tontine.membresMax - tontine.nombreMembres}
        montantCotisation={tontine.montantCotisation}
        devise={tontine.devise}
        frequence={tontine.frequence}
        invitationsEnvoyees={getInvitationsPourTontine(tontine.id)}
      />

      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
        onConfirm={() => {
          confirmModal.action();
          setConfirmModal((prev) => ({ ...prev, open: false }));
        }}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        danger={confirmModal.danger}
      />
    </div>
  );
}
