"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTontine } from "@/contexts/TontineContext";
import { useToast } from "@/contexts/ToastContext";
import { useFinance } from "@/contexts/FinanceContext";
import PaymentModal from "@/components/PaymentModal";
import { formatMontant, formatDate } from "@/lib/data";
import {
  Users,
  CircleDollarSign,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Wallet,
  ArrowDownToLine,
  Mail,
  UserPlus,
  XCircle,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const { getMesTontines, effectuerPaiement } = useTontine();
  const { showToast } = useToast();
  const { getFinancialSummary } = useFinance();

  // Invitations
  const { invitationsRecues, accepterInvitation, refuserInvitation } = useTontine();

  const [paymentModal, setPaymentModal] = useState<{
    open: boolean;
    tontineId: string;
    tourId: string;
    tontineNom: string;
    montant: number;
    devise: string;
    beneficiaire: string;
  }>({ open: false, tontineId: "", tourId: "", tontineNom: "", montant: 0, devise: "EUR", beneficiaire: "" });

  const mesTontines = getMesTontines();
  const tontinesActives = mesTontines.filter((t) => t.statut === "active");

  // Stats
  const allPaiements = mesTontines.flatMap((t) => t.tours).flatMap((t) => t.paiements);
  const paiementsConfirmes = allPaiements.filter((p) => p.statut === "confirme");
  const totalPaye = paiementsConfirmes.reduce((acc, p) => acc + p.montant, 0);
  const paiementsEnAttente = allPaiements.filter((p) => p.statut === "en_attente");
  const totalCotisations = mesTontines.reduce(
    (acc, t) => acc + t.montantCotisation * t.nombreMembres, 0
  );

  const prochainsTours = mesTontines
    .flatMap((t) =>
      t.tours
        .filter((tour) => tour.statut === "en_cours" || tour.statut === "a_venir")
        .map((tour) => ({ ...tour, tontine: t }))
    )
    .sort((a, b) => new Date(a.datePrevue).getTime() - new Date(b.datePrevue).getTime())
    .slice(0, 5);

  // Trouver les paiements en attente de l'utilisateur courant
  const mesPaiementsEnAttente = mesTontines.flatMap((t) =>
    t.tours
      .filter((tour) => tour.statut === "en_cours")
      .flatMap((tour) =>
        tour.paiements
          .filter((p) => p.statut === "en_attente" && (p.membre.id === user?.id || p.membre.email === user?.email))
          .map((p) => ({ ...p, tontine: t, tour }))
      )
  );

  const handlePay = (tontineId: string, tourId: string, tontineNom: string, montant: number, devise: string, beneficiaire: string) => {
    setPaymentModal({ open: true, tontineId, tourId, tontineNom, montant, devise, beneficiaire });
  };

  const handlePaymentConfirm = async (methode: string) => {
    // Paiement via Stripe Connect
    const result = await effectuerPaiement(paymentModal.tontineId, paymentModal.tourId, methode);
    if (result.success) {
      showToast("success", "Paiement effectué !", `Référence: ${result.reference}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Bonjour, {user?.prenom || "là"} 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Voici un aperçu de vos tontines aujourd&apos;hui
          </p>
        </div>
        <Link href="/tontines/creer" className="btn-primary flex items-center gap-2 w-fit">
          <CircleDollarSign className="w-5 h-5" />
          Nouvelle Tontine
        </Link>
      </div>

      {/* Onboarding Banner for new users */}
      {mesTontines.length === 0 && (
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100/50 rounded-full -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🚀</span>
              <h2 className="text-xl font-bold text-gray-900">Bienvenue sur Binq !</h2>
            </div>
            <p className="text-gray-600 mb-6 max-w-lg">
              Commencez par créer votre première tontine ou rejoignez un groupe existant. En quelques clics, gérez vos cotisations et suivez vos tours en temps réel.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {[
                { step: "1", title: "Créez une tontine", desc: "Définissez montant, fréquence et nombre de membres" },
                { step: "2", title: "Invitez vos proches", desc: "Partagez le lien pour compléter votre groupe" },
                { step: "3", title: "Démarrez les tours", desc: "Les cotisations et tours se gèrent automatiquement" },
              ].map((item) => (
                <div key={item.step} className="bg-white/70 rounded-xl p-4 border border-primary-100">
                  <div className="w-8 h-8 bg-primary-600 text-white rounded-lg flex items-center justify-center font-bold text-sm mb-2">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/tontines/creer" className="btn-primary flex items-center gap-2">
                <CircleDollarSign className="w-5 h-5" />
                Créer ma première tontine
              </Link>
              <Link href="/portefeuille" className="btn-secondary flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Alimenter mon portefeuille
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Quick View */}
      <Link href="/portefeuille" className="block">
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white hover:shadow-lg transition-shadow">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-green-200">Solde du portefeuille</p>
                <p className="text-2xl font-bold">{formatMontant(getFinancialSummary().totalCotisationsPaye)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/portefeuille" className="flex items-center gap-1 bg-white/15 hover:bg-white/25 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                <ArrowDownToLine className="w-4 h-4" />
                Déposer
              </Link>
              <ArrowRight className="w-5 h-5 text-green-200" />
            </div>
          </div>
        </div>
      </Link>

      {/* Alertes - Paiements en attente */}
      {mesPaiementsEnAttente.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-amber-800">
              {mesPaiementsEnAttente.length} cotisation(s) en attente
            </h3>
          </div>
          <div className="space-y-2">
            {mesPaiementsEnAttente.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-white rounded-xl p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.tontine.nom}</p>
                  <p className="text-xs text-gray-500">
                    Tour {p.tour.numero} · Bénéficiaire: {p.tour.beneficiaire.prenom} {p.tour.beneficiaire.nom}
                  </p>
                </div>
                <button
                  onClick={() => handlePay(
                    p.tontine.id, p.tour.id, p.tontine.nom,
                    p.tontine.montantCotisation, p.tontine.devise,
                    `${p.tour.beneficiaire.prenom} ${p.tour.beneficiaire.nom}`
                  )}
                  className="btn-primary !py-2 !px-4 text-sm"
                >
                  Payer {formatMontant(p.montant, p.tontine.devise)}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invitations reçues */}
      {invitationsRecues.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-800">
              {invitationsRecues.length} invitation(s) en attente
            </h3>
          </div>
          <div className="space-y-2">
            {invitationsRecues.map((inv) => (
              <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-xl p-4 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <UserPlus className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {inv.inviteur?.prenom} {inv.inviteur?.nom} vous invite
                    </p>
                    <p className="text-xs text-gray-500">
                      Tontine &laquo; {inv.tontine?.nom || 'Tontine'} &raquo;
                      {inv.tontine?.montantCotisation ? ` · ${formatMontant(inv.tontine.montantCotisation, inv.tontine.devise)} / ${inv.tontine.frequence === 'mensuel' ? 'mois' : inv.tontine.frequence === 'hebdomadaire' ? 'sem.' : '2 sem.'}` : ''}
                      {inv.tontine?.nombreMembres !== undefined ? ` · ${inv.tontine.nombreMembres}/${inv.tontine.membresMax} membres` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={async () => {
                      const result = await refuserInvitation(inv.id);
                      if (result.success) {
                        showToast('info', 'Invitation refusée');
                      } else {
                        showToast('error', 'Erreur', result.error);
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Refuser
                  </button>
                  <button
                    onClick={async () => {
                      const result = await accepterInvitation(inv.id);
                      if (result.success) {
                        showToast('success', 'Invitation acceptée !', 'Vous avez rejoint la tontine');
                      } else {
                        showToast('error', 'Erreur', result.error);
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Accepter
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="stat-card">
          <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Users className="w-7 h-7 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Mes Tontines</p>
            <p className="text-2xl font-bold text-gray-900">{mesTontines.length}</p>
            <p className="text-xs text-primary-600 font-medium">{tontinesActives.length} actives</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <CircleDollarSign className="w-7 h-7 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total payé</p>
            <p className="text-2xl font-bold text-gray-900">{formatMontant(totalPaye)}</p>
            <p className="text-xs text-green-600 font-medium flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> Confirmés
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Clock className="w-7 h-7 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">En attente</p>
            <p className="text-2xl font-bold text-gray-900">{paiementsEnAttente.length}</p>
            <p className="text-xs text-amber-600 font-medium">paiements</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Montant total</p>
            <p className="text-2xl font-bold text-gray-900">{formatMontant(totalCotisations)}</p>
            <p className="text-xs text-blue-600 font-medium">toutes tontines</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mes Tontines */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Mes Tontines</h2>
              <Link href="/tontines" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
                Voir tout <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {mesTontines.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Aucune tontine pour le moment</p>
                <Link href="/tontines/creer" className="btn-primary mt-4 inline-flex items-center gap-2">
                  <CircleDollarSign className="w-5 h-5" />
                  Créer ma première tontine
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {mesTontines.map((tontine) => {
                  const tourEnCours = tontine.tours.find((t) => t.statut === "en_cours");
                  const progression = tourEnCours
                    ? Math.round(
                        (tourEnCours.paiements.filter((p) => p.statut === "confirme").length /
                          Math.max(1, tontine.nombreMembres - 1)) * 100
                      )
                    : 0;

                  return (
                    <Link
                      key={tontine.id}
                      href={`/tontines/${tontine.id}`}
                      className="block p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{tontine.nom}</h3>
                            <p className="text-sm text-gray-500">
                              {tontine.nombreMembres}/{tontine.membresMax} membres · {formatMontant(tontine.montantCotisation, tontine.devise)}/mois
                            </p>
                          </div>
                        </div>
                        <span className={tontine.statut === "active" ? "badge-success" : tontine.statut === "en_attente" ? "badge-warning" : "badge-info"}>
                          {tontine.statut === "active" ? "Active" : tontine.statut === "en_attente" ? "En attente" : "Terminée"}
                        </span>
                      </div>

                      {tourEnCours && (
                        <div className="mt-3">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs text-gray-500">
                              Tour {tourEnCours.numero} · {tourEnCours.beneficiaire.prenom} {tourEnCours.beneficiaire.nom}
                            </span>
                            <span className="text-xs font-bold text-primary-600">{progression}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${progression}%` }}></div>
                          </div>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Prochains tours */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-600" />
              Prochains tours
            </h2>
            {prochainsTours.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Aucun tour planifié</p>
            ) : (
              <div className="space-y-3">
                {prochainsTours.map((tour) => (
                  <Link
                    key={tour.id}
                    href={`/tontines/${tour.tontine.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      tour.statut === "en_cours" ? "bg-amber-100" : "bg-blue-100"
                    }`}>
                      {tour.statut === "en_cours" ? (
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {tour.beneficiaire.prenom} {tour.beneficiaire.nom}
                      </p>
                      <p className="text-xs text-gray-500">{tour.tontine.nom} · {formatDate(tour.datePrevue)}</p>
                    </div>
                    <span className={tour.statut === "en_cours" ? "badge-warning" : "badge-info"}>
                      {tour.statut === "en_cours" ? "En cours" : "À venir"}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Derniers paiements */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary-600" />
              Derniers paiements
            </h2>
            {paiementsConfirmes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Aucun paiement pour le moment</p>
            ) : (
              <div className="space-y-3">
                {paiementsConfirmes.slice(-4).reverse().map((p) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.membre.prenom} {p.membre.nom}</p>
                      <p className="text-xs text-gray-500">{formatDate(p.datePaiement)}</p>
                    </div>
                    <span className="text-sm font-bold text-green-600">{formatMontant(p.montant)}</span>
                  </div>
                ))}
              </div>
            )}
            <Link href="/paiements" className="mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
              Voir tous les paiements <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModal.open}
        onClose={() => setPaymentModal((prev) => ({ ...prev, open: false }))}
        onConfirm={handlePaymentConfirm}
        tontineNom={paymentModal.tontineNom}
        montant={paymentModal.montant}
        devise={paymentModal.devise}
        beneficiaire={paymentModal.beneficiaire}
      />
    </div>
  );
}
