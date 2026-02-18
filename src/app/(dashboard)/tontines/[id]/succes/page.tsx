"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useTontine } from "@/contexts/TontineContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
  CheckCircle2,
  Copy,
  Share2,
  MessageCircle,
  Mail,
  Users,
  ArrowRight,
  PartyPopper,
  Calendar,
  CircleDollarSign,
  Globe,
  Lock,
  Star,
  UserPlus,
  Rocket,
  Eye,
} from "lucide-react";
import Link from "next/link";

export default function TontineSuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { inviterMembre, getTontineById } = useTontine();
  const { showToast } = useToast();

  const tontineId = params.id as string;
  const nom = searchParams.get("nom") || "Ma tontine";
  const montant = searchParams.get("montant") || "0";
  const frequence = searchParams.get("frequence") || "mensuel";
  const membres = searchParams.get("membres") || "10";
  const couleur = searchParams.get("couleur") || "emerald";
  const categorie = searchParams.get("categorie") || "autre";
  const visibilite = searchParams.get("visibilite") || "publique";

  const [inviteCode, setInviteCode] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://binq.io";
  const inviteLink = inviteCode ? `${appUrl}/rejoindre/${inviteCode}` : "";

  const COULEUR_MAP: Record<string, string> = {
    emerald: "from-emerald-400 to-emerald-600",
    blue: "from-blue-400 to-blue-600",
    indigo: "from-indigo-400 to-indigo-600",
    purple: "from-purple-400 to-purple-600",
    rose: "from-rose-400 to-rose-600",
    orange: "from-orange-400 to-orange-600",
    amber: "from-amber-400 to-amber-600",
    teal: "from-teal-400 to-teal-600",
    slate: "from-slate-600 to-slate-800",
  };

  const FREQ_LABEL: Record<string, string> = {
    hebdomadaire: "Hebdomadaire",
    bimensuel: "Bimensuel",
    mensuel: "Mensuel",
  };

  // Auto-generate invite code on mount
  const generateInviteCode = useCallback(async () => {
    if (inviteCode || inviteLoading) return;
    setInviteLoading(true);
    try {
      const result = await inviterMembre(tontineId, "", "");
      if (result.code) {
        setInviteCode(result.code);
      }
    } catch {
      // Silently fail, user can generate manually
    } finally {
      setInviteLoading(false);
    }
  }, [tontineId, inviterMembre, inviteCode, inviteLoading]);

  useEffect(() => {
    generateInviteCode();
    // Confetti effect
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const potEstime = Number(montant) * (Number(membres) - 1);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    showToast("success", "Copié !", "Le lien a été copié dans le presse-papier");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const msg = `🌟 Rejoins ma tontine "${nom}" sur Binq !\n\n💰 Cotisation : ${Number(montant).toLocaleString("fr-FR")} €/${frequence}\n👥 ${membres} membres max\n🏆 Pot par tour : ${potEstime.toLocaleString("fr-FR")} €\n\n👉 ${inviteLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const shareEmail = () => {
    const subject = `Rejoins ma tontine "${nom}" sur Binq !`;
    const body = `Salut !\n\nJe t'invite à rejoindre ma tontine "${nom}" sur Binq.\n\nCotisation : ${Number(montant).toLocaleString("fr-FR")} €\nFréquence : ${FREQ_LABEL[frequence] || frequence}\nPot par tour : ${potEstime.toLocaleString("fr-FR")} €\n\nClique ici pour rejoindre : ${inviteLink}\n\nÀ bientôt !`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Rejoindre "${nom}" sur Binq`,
          text: `Rejoins ma tontine "${nom}" ! Cotisation: ${Number(montant).toLocaleString("fr-FR")} €/${frequence}`,
          url: inviteLink,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopy(inviteLink);
    }
  };

  const gradient = COULEUR_MAP[couleur] || COULEUR_MAP.emerald;

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-6">
      
      {/* Confetti animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
                fontSize: `${12 + Math.random() * 16}px`,
              }}
            >
              {["🎉", "⭐", "🎊", "✨", "💰"][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className={`w-20 h-20 bg-gradient-to-br ${gradient} rounded-3xl flex items-center justify-center mx-auto shadow-lg`}>
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tontine créée avec succès !</h1>
          <p className="text-gray-500 mt-2">Votre tontine <strong className="text-gray-700">&ldquo;{nom}&rdquo;</strong> est prête</p>
        </div>
      </div>

      {/* Tontine Summary Card */}
      <div className="card overflow-hidden">
        <div className={`bg-gradient-to-br ${gradient} p-6 -mx-6 -mt-6 mb-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{nom}</h2>
                <p className="text-white/80 text-sm capitalize">{FREQ_LABEL[frequence] || frequence}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-medium">
              {visibilite === "publique" ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              {visibilite === "publique" ? "Publique" : "Privée"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <CircleDollarSign className="w-5 h-5 text-gray-400 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Cotisation</p>
            <p className="font-bold text-gray-900">{Number(montant).toLocaleString("fr-FR")} €</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <Users className="w-5 h-5 text-gray-400 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Membres max</p>
            <p className="font-bold text-gray-900">{membres}</p>
          </div>
          <div className="bg-primary-50 rounded-xl p-3 text-center">
            <PartyPopper className="w-5 h-5 text-primary-500 mx-auto mb-1" />
            <p className="text-xs text-primary-600">Pot par tour</p>
            <p className="font-bold text-primary-700">{potEstime.toLocaleString("fr-FR")} €</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <Calendar className="w-5 h-5 text-gray-400 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Fréquence</p>
            <p className="font-bold text-gray-900">{FREQ_LABEL[frequence] || frequence}</p>
          </div>
        </div>
      </div>

      {/* Invite Section */}
      <div className="card space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Invitez vos membres</h3>
            <p className="text-sm text-gray-500">Partagez le lien pour que vos proches rejoignent la tontine</p>
          </div>
        </div>

        {/* Invite Link */}
        {inviteCode ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 border border-gray-200">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 bg-transparent text-sm text-gray-700 font-mono outline-none truncate"
              />
              <button
                onClick={() => handleCopy(inviteLink)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  copied
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-primary-600 text-white hover:bg-primary-700"
                }`}
              >
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copié" : "Copier"}
              </button>
            </div>

            {/* Share buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={shareWhatsApp}
                className="flex items-center justify-center gap-2 bg-[#25D366] text-white px-4 py-3 rounded-xl font-medium text-sm hover:bg-[#20bd5a] transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </button>
              <button
                onClick={shareEmail}
                className="flex items-center justify-center gap-2 bg-gray-700 text-white px-4 py-3 rounded-xl font-medium text-sm hover:bg-gray-800 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Email
              </button>
              <button
                onClick={shareNative}
                className="flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-3 rounded-xl font-medium text-sm hover:bg-primary-700 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Partager
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-600 border-t-transparent" />
            <span className="ml-3 text-sm text-gray-500">Génération du lien d&apos;invitation...</span>
          </div>
        )}
      </div>

      {/* Next Steps */}
      <div className="card space-y-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Rocket className="w-5 h-5 text-primary-600" />
          Prochaines étapes
        </h3>

        <div className="space-y-3">
          {[
            {
              step: 1,
              title: "Invitez vos membres",
              desc: "Partagez le lien d'invitation via WhatsApp, email ou SMS",
              icon: UserPlus,
              done: !!inviteCode,
              color: "emerald",
            },
            {
              step: 2,
              title: "Attendez que tous rejoignent",
              desc: `${membres} membres doivent rejoindre la tontine pour la compléter`,
              icon: Users,
              done: false,
              color: "blue",
            },
            {
              step: 3,
              title: "Démarrez la tontine",
              desc: "Une fois le groupe complet, lancez les tours de cotisation",
              icon: Rocket,
              done: false,
              color: "purple",
            },
          ].map((item) => (
            <div
              key={item.step}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                item.done
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-white border-gray-100"
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                item.done
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-100 text-gray-400"
              }`}>
                {item.done ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-bold">{item.step}</span>
                )}
              </div>
              <div>
                <p className={`font-semibold ${item.done ? "text-emerald-900" : "text-gray-900"}`}>
                  {item.title}
                </p>
                <p className={`text-sm ${item.done ? "text-emerald-600" : "text-gray-500"}`}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href={`/tontines/${tontineId}`}
          className="btn-primary flex items-center justify-center gap-2 flex-1"
        >
          <Eye className="w-5 h-5" />
          Voir ma tontine
        </Link>
        <Link
          href="/tontines"
          className="btn-secondary flex items-center justify-center gap-2 flex-1"
        >
          Retour aux tontines
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
