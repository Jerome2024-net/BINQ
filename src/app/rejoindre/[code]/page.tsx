"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Star,
  Users,
  Euro,
  Calendar,
  Trophy,
  Shield,
  ArrowRight,
  LogIn,
  UserPlus,
  Check,
  Loader2,
  Sparkles,
  Clock,
  Zap,
  Wallet,
  Eye,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTontine } from "@/contexts/TontineContext";
import { useToast } from "@/contexts/ToastContext";
import { Invitation, Membre } from "@/types";
import StripeVerificationGuard from "@/components/StripeVerificationGuard";

export default function RejoindreParCodePage({
  params,
}: {
  params: { code: string };
}) {
  const { code } = params;
  const { user } = useAuth();
  const { getInvitationByCode, accepterInvitation, tontines } = useTontine();
  const { showToast } = useToast();
  const router = useRouter();

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const inv = await getInvitationByCode(code);
        if (!inv) {
          setError("not_found");
        } else if (inv.statut !== "en_attente") {
          setError("already_used");
        } else {
          setInvitation(inv);
          if (user) {
            const tontine = tontines.find((t) => t.id === inv.tontineId);
            if (tontine?.membres.some((m) => m.userId === user.id)) {
              setError("already_member");
            }
          }
        }
      } catch {
        setError("not_found");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [code, user, tontines, getInvitationByCode]);

  const handleJoin = async () => {
    if (!invitation || !user) return;
    setJoining(true);
    try {
      const result = await accepterInvitation(invitation.id);
      if (result.success) {
        setJoined(true);
        showToast("success", "Bienvenue dans la tontine !");
      } else {
        showToast("error", result.error || "Erreur lors de l'adhésion");
      }
    } catch {
      showToast("error", "Erreur lors de l'adhésion");
    } finally {
      setJoining(false);
    }
  };

  const tontine = invitation ? tontines.find((t) => t.id === invitation.tontineId) || invitation.tontine : null;
  const potTotal = tontine ? tontine.montantCotisation * tontine.membresMax : 0;
  const placesRestantes = tontine ? tontine.membresMax - (tontine.nombreMembres ?? tontine.membres?.length ?? 0) : 0;
  const fillPercent = tontine ? Math.round(((tontine.nombreMembres ?? tontine.membres?.length ?? 0) / tontine.membresMax) * 100) : 0;
  const inviteurNom = invitation?.inviteur
    ? [invitation.inviteur.prenom, invitation.inviteur.nom].filter(Boolean).join(" ")
    : "Un organisateur";
  const membres: Membre[] = tontine?.membres || [];
  const MAX_AVATARS_SHOWN = 5;
  const membresAffiches = membres.slice(0, MAX_AVATARS_SHOWN);
  const membresRestants = Math.max(0, membres.length - MAX_AVATARS_SHOWN);
  const nombreMembresCourant = tontine?.nombreMembres ?? tontine?.membres?.length ?? 0;
  const positionNouveau = nombreMembresCourant + 1;

  // Formater la date de début
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return null;
    }
  };
  const dateDebutFormatee = formatDate(tontine?.dateDebut);
  const tontineEmoji = tontine?.emoji;

  // ─── Loading ───
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center relative overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-500/15 rounded-full blur-3xl" />
        <div className="text-center relative z-10">
          <div className="w-12 h-12 border-[3px] border-primary-400/30 border-t-primary-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Chargement de l&apos;invitation...</p>
        </div>
      </div>
    );
  }

  // ─── Errors ───
  if (error) {
    const errorConfig = {
      not_found: { emoji: "🔍", title: "Invitation introuvable", desc: "Ce lien d'invitation n'est pas valide ou a expiré." },
      already_used: { emoji: "⏳", title: "Invitation déjà utilisée", desc: "Cette invitation a déjà été acceptée ou a expiré." },
      already_member: { emoji: "👋", title: "Déjà membre !", desc: "Vous faites déjà partie de cette tontine." },
    }[error] || { emoji: "❌", title: "Erreur", desc: "Une erreur est survenue." };

    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-red-500/10 rounded-full blur-3xl" />
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-10 max-w-md w-full text-center relative z-10 animate-fade-up">
          <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <span className="text-4xl">{errorConfig.emoji}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{errorConfig.title}</h1>
          <p className="text-gray-400 mb-8 leading-relaxed">{errorConfig.desc}</p>
          <button
            onClick={() => router.push(user ? "/dashboard" : "/")}
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-all"
          >
            {user ? "Aller au dashboard" : "Retour à l'accueil"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ─── Joined success ───
  if (joined) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-primary-500/15 rounded-full blur-3xl" />
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-10 max-w-md w-full text-center relative z-10 animate-fade-up">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-5">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Bienvenue ! 🎉</h1>
          <p className="text-gray-400 mb-4">
            Vous avez rejoint <span className="font-semibold text-white">{tontine?.nom}</span>
          </p>

          {/* Position */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full mb-5">
            <Users className="w-4 h-4 text-primary-400" />
            <span className="text-sm text-primary-300 font-medium">Votre position : <span className="text-white font-bold">#{positionNouveau}</span> sur {tontine?.membresMax ?? 0}</span>
          </div>

          {/* Membres avatars dans le succès */}
          {membres.length > 0 && (
            <div className="mb-5">
              <p className="text-xs text-gray-500 mb-3">Vos co-membres</p>
              <div className="flex items-center justify-center -space-x-2">
                {membresAffiches.map((m) => {
                  const initials = [m.user?.prenom?.[0], m.user?.nom?.[0]].filter(Boolean).join("").toUpperCase() || "?";
                  return (
                    <div key={m.id} className="relative group">
                      {m.user?.avatar ? (
                        <img
                          src={m.user.avatar}
                          alt={`${m.user.prenom || ""} ${m.user.nom || ""}`}
                          className="w-10 h-10 rounded-full border-2 border-gray-900 object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full border-2 border-gray-900 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{initials}</span>
                        </div>
                      )}
                      <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {m.user?.prenom || "Membre"}
                      </div>
                    </div>
                  );
                })}
                {membresRestants > 0 && (
                  <div className="w-10 h-10 rounded-full border-2 border-gray-900 bg-gray-800 flex items-center justify-center">
                    <span className="text-gray-400 text-xs font-bold">+{membresRestants}</span>
                  </div>
                )}
                {/* Avatar du nouveau membre (vous) */}
                {user && (
                  <div className="w-10 h-10 rounded-full border-2 border-emerald-500 bg-gradient-to-br from-emerald-500/30 to-emerald-600/30 flex items-center justify-center ring-2 ring-emerald-500/30">
                    <span className="text-emerald-300 text-xs font-bold">
                      {[user.prenom?.[0], user.nom?.[0]].filter(Boolean).join("").toUpperCase() || "V"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Infos clés */}
          <div className="bg-gray-800/50 rounded-xl p-4 mb-5 space-y-2">
            {dateDebutFormatee && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Prochaine cotisation</span>
                <span className="text-white font-semibold">{dateDebutFormatee}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400 flex items-center gap-2"><Euro className="w-3.5 h-3.5" /> Montant</span>
              <span className="text-white font-semibold">{tontine?.montantCotisation ?? 0}€ / {tontine?.frequence === "hebdomadaire" ? "semaine" : tontine?.frequence === "bimensuel" ? "2 sem." : "mois"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400 flex items-center gap-2"><Trophy className="w-3.5 h-3.5" /> Pot par tour</span>
              <span className="text-emerald-400 font-semibold">{potTotal}€</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/tontines/${invitation?.tontineId}`)}
              className="flex-1 py-3 bg-white text-gray-900 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-100 transition-all"
            >
              <Eye className="w-4 h-4" />
              Voir la tontine
            </button>
            <button
              onClick={() => router.push("/portefeuille")}
              className="flex-1 py-3 border border-gray-700 text-gray-300 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-all"
            >
              <Wallet className="w-4 h-4" />
              Déposer des fonds
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main invitation page ───
  return (
    <div className="min-h-screen bg-gray-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary-600/15 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent-500/10 rounded-full blur-[120px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary-500/5 rounded-full blur-[100px]" />

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 py-10">
        <div className="w-full max-w-lg">
          {/* Logo */}
          <div className="text-center mb-8 animate-fade-up">
            <div className="inline-flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
                <Star className="w-5 h-5 text-white fill-current" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Binq</span>
            </div>
          </div>

          {/* Invitation badge */}
          <div className="text-center mb-5 animate-fade-up" style={{ animationDelay: "0.05s" }}>
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-300 text-sm font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Invitation personnelle
            </span>
          </div>

          {/* Tontine visual + Inviteur */}
          <div className="text-center mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            {/* Tontine emoji/image */}
            {(tontineEmoji || tontine?.image) && (
              <div className="mb-3">
                {tontine?.image ? (
                  <img src={tontine.image} alt={tontine.nom} className="w-16 h-16 rounded-2xl object-cover mx-auto border border-gray-700 shadow-lg" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center mx-auto shadow-lg">
                    <span className="text-3xl">{tontineEmoji}</span>
                  </div>
                )}
              </div>
            )}
            <p className="text-gray-400 text-sm">
              <span className="text-white font-medium">{inviteurNom}</span> vous invite à rejoindre
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-white mt-2 tracking-tight">
              {tontine?.nom || "Tontine"}
            </h1>
            {tontine?.description && (
              <p className="text-gray-400 mt-2 text-sm max-w-sm mx-auto leading-relaxed">{tontine.description}</p>
            )}
          </div>

          {/* Main card */}
          <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-3xl overflow-hidden animate-fade-up" style={{ animationDelay: "0.15s" }}>
            {/* Stats row */}
            <div className="grid grid-cols-3">
              <div className="p-5 text-center border-r border-gray-800">
                <div className="w-9 h-9 bg-primary-500/10 border border-primary-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Euro className="w-4 h-4 text-primary-400" />
                </div>
                <p className="text-xl font-bold text-white">{tontine?.montantCotisation ?? 0}<span className="text-sm font-normal text-gray-500 ml-0.5">€</span></p>
                <p className="text-[11px] text-gray-500 uppercase tracking-wider mt-0.5">Cotisation</p>
              </div>
              <div className="p-5 text-center border-r border-gray-800">
                <div className="w-9 h-9 bg-accent-500/10 border border-accent-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Trophy className="w-4 h-4 text-accent-400" />
                </div>
                <p className="text-xl font-bold text-white">{potTotal}<span className="text-sm font-normal text-gray-500 ml-0.5">€</span></p>
                <p className="text-[11px] text-gray-500 uppercase tracking-wider mt-0.5">Pot / tour</p>
              </div>
              <div className="p-5 text-center">
                <div className="w-9 h-9 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-xl font-bold text-white">{placesRestantes}</p>
                <p className="text-[11px] text-gray-500 uppercase tracking-wider mt-0.5">Place{placesRestantes > 1 ? "s" : ""} dispo</p>
              </div>
            </div>

            {/* Fill progress */}
            <div className="px-6 py-4 border-t border-gray-800">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Users className="w-3 h-3" />
                  {tontine?.nombreMembres ?? tontine?.membres?.length ?? 0}/{tontine?.membresMax ?? 0} membres
                </span>
                <span className="text-primary-400 font-medium">{fillPercent}%</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
              {placesRestantes <= 3 && placesRestantes > 0 && (
                <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Plus que {placesRestantes} place{placesRestantes > 1 ? "s" : ""} — ne tardez pas !
                </p>
              )}
            </div>

            {/* Membres déjà inscrits */}
            {membres.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Membres inscrits</span>
                  <span className="text-xs text-gray-500">{membres.length} participant{membres.length > 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center -space-x-2.5">
                    {membresAffiches.map((m) => {
                      const initials = [m.user?.prenom?.[0], m.user?.nom?.[0]].filter(Boolean).join("").toUpperCase() || "?";
                      const colors = [
                        "from-primary-500 to-primary-700",
                        "from-accent-500 to-accent-700",
                        "from-blue-500 to-blue-700",
                        "from-emerald-500 to-emerald-700",
                        "from-amber-500 to-amber-700",
                        "from-rose-500 to-rose-700",
                      ];
                      const colorIndex = m.id.charCodeAt(0) % colors.length;
                      return (
                        <div key={m.id} className="relative group">
                          {m.user?.avatar ? (
                            <img
                              src={m.user.avatar}
                              alt={`${m.user.prenom || ""} ${m.user.nom || ""}`}
                              className="w-9 h-9 rounded-full border-2 border-gray-900 object-cover hover:scale-110 hover:z-10 transition-transform cursor-default"
                            />
                          ) : (
                            <div className={`w-9 h-9 rounded-full border-2 border-gray-900 bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center hover:scale-110 hover:z-10 transition-transform cursor-default`}>
                              <span className="text-white text-[11px] font-bold">{initials}</span>
                            </div>
                          )}
                          {m.role === "organisateur" && (
                            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full flex items-center justify-center border border-gray-900">
                              <Star className="w-2 h-2 text-white fill-current" />
                            </div>
                          )}
                          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
                            {[m.user?.prenom, m.user?.nom].filter(Boolean).join(" ") || "Membre"}
                            {m.role === "organisateur" && " ★"}
                          </div>
                        </div>
                      );
                    })}
                    {membresRestants > 0 && (
                      <div className="w-9 h-9 rounded-full border-2 border-gray-900 bg-gray-800 flex items-center justify-center">
                        <span className="text-gray-400 text-[11px] font-bold">+{membresRestants}</span>
                      </div>
                    )}
                  </div>
                  {/* Places vides */}
                  {placesRestantes > 0 && placesRestantes <= 4 && (
                    <div className="flex items-center -space-x-2">
                      {Array.from({ length: Math.min(placesRestantes, 3) }).map((_, i) => (
                        <div key={`empty-${i}`} className="w-9 h-9 rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center">
                          <UserPlus className="w-3.5 h-3.5 text-gray-600" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Details */}
            <div className="px-6 py-4 border-t border-gray-800 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  Fréquence
                </span>
                <span className="font-medium text-white capitalize">{tontine?.frequence ?? "—"}</span>
              </div>
              {dateDebutFormatee && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    Commence le
                  </span>
                  <span className="font-medium text-white">{dateDebutFormatee}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  Durée estimée
                </span>
                <span className="font-medium text-white">{tontine?.membresMax ?? 0} tours</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-500" />
                  Paiements
                </span>
                <span className="font-medium text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Sécurisés par Stripe
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="p-6 border-t border-gray-800">
              {placesRestantes <= 0 ? (
                <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-300">
                  <Clock className="w-5 h-5 flex-shrink-0" />
                  <span>Cette tontine est complète. Aucune place disponible.</span>
                </div>
              ) : user ? (
                <StripeVerificationGuard action="rejoindre cette tontine">
                  <button
                    onClick={handleJoin}
                    disabled={joining}
                    className="group w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2.5 hover:shadow-xl hover:shadow-primary-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none text-[15px]"
                  >
                    {joining ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Adhésion en cours...
                      </>
                    ) : (
                      <>
                        Rejoindre la tontine
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </StripeVerificationGuard>
              ) : (
                <div className="space-y-3">
                  <p className="text-center text-sm text-gray-400 mb-1">
                    Connectez-vous pour rejoindre cette tontine
                  </p>
                  <button
                    onClick={() => router.push(`/connexion?redirect=/rejoindre/${code}`)}
                    className="group w-full py-3.5 bg-white text-gray-900 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-100 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                  >
                    <LogIn className="w-4 h-4" />
                    Se connecter
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                  <button
                    onClick={() => router.push(`/inscription?redirect=/rejoindre/${code}`)}
                    className="w-full py-3 border border-gray-700 text-gray-300 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-800 hover:border-gray-600 transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    Créer un compte gratuitement
                  </button>
                  <p className="text-center text-xs text-gray-500 mt-1">
                    Le code d&apos;invitation sera conservé automatiquement
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Trust section */}
          <div className="mt-8 animate-fade-up" style={{ animationDelay: "0.25s" }}>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center gap-1.5 p-3 bg-gray-900/60 border border-gray-800/60 rounded-xl">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] text-gray-400 text-center leading-tight">Paiements<br />sécurisés</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 bg-gray-900/60 border border-gray-800/60 rounded-xl">
                <Users className="w-4 h-4 text-primary-400" />
                <span className="text-[11px] text-gray-400 text-center leading-tight">Groupes<br />de confiance</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 bg-gray-900/60 border border-gray-800/60 rounded-xl">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] text-gray-400 text-center leading-tight">Inscription<br />en 30 sec</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-[11px] text-gray-600 mt-6">
            En rejoignant, vous acceptez les conditions d&apos;utilisation de Binq
          </p>
        </div>
      </div>
    </div>
  );
}
