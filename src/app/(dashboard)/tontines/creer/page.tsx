"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTontine } from "@/contexts/TontineContext";
import { useFinance } from "@/contexts/FinanceContext";
import { useToast } from "@/contexts/ToastContext";
import SubscriptionModal from "@/components/SubscriptionModal";
import TontineImageUpload from "@/components/TontineImageUpload";
import {
  ArrowLeft,
  CircleDollarSign,
  Users,
  Calendar,
  Info,
  ArrowRight,
  Loader2,
  Crown,
  ShieldAlert,
  CreditCard,
  Palette,
  Eye,
  EyeOff,
  Tag,
  Smile,
  Lock,
  Globe,
  Camera,
} from "lucide-react";

export default function CreerTontinePage() {
  const router = useRouter();
  const { creerTontine } = useTontine();
  const { isAbonnementActif, souscrireAbonnement, getFraisConfig } = useFinance();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    montantCotisation: "",
    devise: "EUR",
    frequence: "mensuel",
    membresMax: "10",
    dateDebut: "",
    regles: "",
    emoji: "💰",
    couleur: "emerald",
    categorie: "autre",
    visibilite: "publique",
  });

  const EMOJI_OPTIONS = ["💰", "🏦", "🤝", "👨‍👩‍👧‍👦", "🎯", "💎", "🏠", "🚗", "✈️", "📚", "💼", "🎓", "🏥", "🌍", "⭐", "🔥"];
  
  const COULEUR_OPTIONS = [
    { value: "emerald", label: "Émeraude", class: "bg-emerald-500" },
    { value: "blue", label: "Bleu", class: "bg-blue-500" },
    { value: "purple", label: "Violet", class: "bg-purple-500" },
    { value: "orange", label: "Orange", class: "bg-orange-500" },
    { value: "rose", label: "Rose", class: "bg-rose-500" },
    { value: "cyan", label: "Cyan", class: "bg-cyan-500" },
    { value: "amber", label: "Ambre", class: "bg-amber-500" },
    { value: "indigo", label: "Indigo", class: "bg-indigo-500" },
  ];

  const CATEGORIE_OPTIONS = [
    { value: "famille", label: "Famille", emoji: "👨‍👩‍👧‍👦" },
    { value: "amis", label: "Amis", emoji: "🤝" },
    { value: "collegues", label: "Collègues", emoji: "💼" },
    { value: "communaute", label: "Communauté", emoji: "🌍" },
    { value: "autre", label: "Autre", emoji: "⭐" },
  ];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newTontine = await creerTontine({
        nom: formData.nom,
        description: formData.description,
        montantCotisation: Number(formData.montantCotisation),
        devise: formData.devise,
        frequence: formData.frequence as "hebdomadaire" | "bimensuel" | "mensuel",
        membresMax: Number(formData.membresMax),
        dateDebut: formData.dateDebut,
        regles: formData.regles,
        emoji: formData.emoji,
        couleur: formData.couleur,
        categorie: formData.categorie as "famille" | "amis" | "collegues" | "communaute" | "autre",
        visibilite: formData.visibilite as "publique" | "privee",
      });

      // Upload de l'image si sélectionnée
      if (imageFile) {
        try {
          const imgFormData = new FormData();
          imgFormData.append("file", imageFile);
          imgFormData.append("tontineId", newTontine.id);
          const res = await fetch("/api/tontine/upload-image", {
            method: "POST",
            body: imgFormData,
          });
          if (!res.ok) {
            console.error("Image upload failed");
          }
        } catch (imgErr) {
          console.error("Image upload error:", imgErr);
        }
      }

      showToast("success", "Tontine créée !", `"${formData.nom}" a été créée avec succès`);
      router.push(`/tontines/${newTontine.id}`);
    } catch (err) {
      showToast("error", "Erreur", err instanceof Error ? err.message : "Une erreur est survenue");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/tontines"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-600 transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux tontines
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Créer une nouvelle Tontine
        </h1>
        <p className="text-gray-500 mt-1">
          Définissez les paramètres de votre tontine et invitez vos membres
        </p>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-medium mb-1">Comment ça marche ?</p>
          <p>
            Créez votre tontine en définissant le montant de cotisation, la
            fréquence et le nombre maximum de membres. Une fois créée, vous
            pourrez inviter des membres via un lien ou leur numéro de téléphone.
          </p>
        </div>
      </div>

      {/* Subscription Gate */}
      {!isAbonnementActif() && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Activez votre accès organisateur</h3>
            <p className="text-gray-600 mt-1">
              Pour créer et gérer des tontines, activez votre essai gratuit de 90 jours — sans engagement.
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-blue-100 max-w-sm mx-auto">
            <p className="text-2xl font-bold text-blue-600 mb-1">🎁 Essai gratuit 90 jours</p>
            <p className="text-sm text-gray-500">Puis {(getFraisConfig().abonnementAnnuel).toLocaleString("fr-FR")} €/an</p>
            <ul className="text-sm text-gray-600 mt-3 space-y-1 text-left">
              <li>✅ Tontines illimitées</li>
              <li>✅ Gestion complète des membres</li>
              <li>✅ Tableau de bord organisateur</li>
              <li>✅ Sans carte bancaire</li>
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => setSubscriptionModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              <CreditCard className="w-5 h-5" />
              Commencer l&apos;essai gratuit
            </button>
            <Link
              href="/portefeuille"
              className="flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Voir mon portefeuille
            </Link>
          </div>
        </div>
      )}

      {/* Modal Abonnement in-app */}
      <SubscriptionModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
      />

      {/* Form */}
      {isAbonnementActif() && (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CircleDollarSign className="w-5 h-5 text-primary-600" />
            Informations générales
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nom de la tontine *
              </label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                className="input-field"
                placeholder="Ex: Tontine Solidarité"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input-field min-h-[100px] resize-none"
                placeholder="Décrivez l'objectif de votre tontine..."
              />
            </div>
          </div>
        </div>

        {/* Profil visuel */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary-600" />
            Profil visuel
          </h2>

          <div className="space-y-5">
            {/* Emoji */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Smile className="w-4 h-4 inline mr-1" />
                Icône de la tontine
              </label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData({ ...formData, emoji })}
                    className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center transition-all ${
                      formData.emoji === emoji
                        ? "bg-primary-100 border-2 border-primary-500 scale-110 shadow-md"
                        : "bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:scale-105"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Couleur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Palette className="w-4 h-4 inline mr-1" />
                Couleur du thème
              </label>
              <div className="flex flex-wrap gap-3">
                {COULEUR_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, couleur: c.value })}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                      formData.couleur === c.value
                        ? "ring-2 ring-offset-2 ring-primary-500 bg-white shadow-md"
                        : "bg-gray-50 hover:bg-white hover:shadow-sm"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full ${c.class}`} />
                    <span className="text-sm font-medium text-gray-700">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Catégorie
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIE_OPTIONS.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, categorie: cat.value })}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      formData.categorie === cat.value
                        ? "bg-primary-50 border-2 border-primary-500 text-primary-700"
                        : "bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-lg">{cat.emoji}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo de profil */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Camera className="w-4 h-4 inline mr-1" />
                Photo de profil (optionnel)
              </label>
              <TontineImageUpload
                inline
                currentEmoji={formData.emoji}
                onUploadComplete={(url) => setImagePreview(url)}
                onFileSelect={(file) => setImageFile(file)}
              />
            </div>

            {/* Visibilité */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visibilité
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, visibilite: "publique" })}
                  className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
                    formData.visibilite === "publique"
                      ? "bg-emerald-50 border-2 border-emerald-500"
                      : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <Globe className={`w-5 h-5 ${formData.visibilite === "publique" ? "text-emerald-600" : "text-gray-400"}`} />
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${formData.visibilite === "publique" ? "text-emerald-700" : "text-gray-700"}`}>Publique</p>
                    <p className="text-xs text-gray-500">Visible par tous</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, visibilite: "privee" })}
                  className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
                    formData.visibilite === "privee"
                      ? "bg-amber-50 border-2 border-amber-500"
                      : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <Lock className={`w-5 h-5 ${formData.visibilite === "privee" ? "text-amber-600" : "text-gray-400"}`} />
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${formData.visibilite === "privee" ? "text-amber-700" : "text-gray-700"}`}>Privée</p>
                    <p className="text-xs text-gray-500">Sur invitation</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CircleDollarSign className="w-5 h-5 text-primary-600" />
            Paramètres financiers
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Montant de la cotisation *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="montantCotisation"
                    value={formData.montantCotisation}
                    onChange={handleChange}
                    className="input-field pr-16"
                    placeholder="50000"
                    min="1000"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                    €
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Fréquence *
                </label>
                <select
                  name="frequence"
                  value={formData.frequence}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="hebdomadaire">Hebdomadaire</option>
                  <option value="bimensuel">Bimensuel</option>
                  <option value="mensuel">Mensuel</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-600" />
            Paramètres du groupe
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nombre maximum de membres *
                </label>
                <input
                  type="number"
                  name="membresMax"
                  value={formData.membresMax}
                  onChange={handleChange}
                  className="input-field"
                  min="2"
                  max="50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Date de début *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    name="dateDebut"
                    value={formData.dateDebut}
                    onChange={handleChange}
                    className="input-field pl-12"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Règles de la tontine (optionnel)
              </label>
              <textarea
                name="regles"
                value={formData.regles}
                onChange={handleChange}
                className="input-field min-h-[80px] resize-none"
                placeholder="Ex: Pénalité de 8€ en cas de retard..."
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        {formData.nom && formData.montantCotisation && (
          <div className="card bg-primary-50 border-primary-200">
            <h3 className="font-bold text-primary-900 mb-3 flex items-center gap-2">
              <span className="text-2xl">{formData.emoji}</span>
              Aperçu de votre tontine
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-primary-600">Nom:</span>{" "}
                <span className="font-semibold text-primary-900">{formData.nom}</span>
              </div>
              <div>
                <span className="text-primary-600">Cotisation:</span>{" "}
                <span className="font-semibold text-primary-900">
                  {Number(formData.montantCotisation).toLocaleString("fr-FR")}{" "}
                  €
                </span>
              </div>
              <div>
                <span className="text-primary-600">Fréquence:</span>{" "}
                <span className="font-semibold text-primary-900 capitalize">
                  {formData.frequence}
                </span>
              </div>
              <div>
                <span className="text-primary-600">Max membres:</span>{" "}
                <span className="font-semibold text-primary-900">
                  {formData.membresMax}
                </span>
              </div>
              <div>
                <span className="text-primary-600">Catégorie:</span>{" "}
                <span className="font-semibold text-primary-900 capitalize">
                  {CATEGORIE_OPTIONS.find(c => c.value === formData.categorie)?.label || formData.categorie}
                </span>
              </div>
              <div>
                <span className="text-primary-600">Visibilité:</span>{" "}
                <span className="font-semibold text-primary-900 capitalize flex items-center gap-1">
                  {formData.visibilite === "publique" ? <Globe className="w-3.5 h-3.5 inline" /> : <Lock className="w-3.5 h-3.5 inline" />}
                  {formData.visibilite === "publique" ? "Publique" : "Privée"}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-primary-600">Cagnotte par tour:</span>{" "}
                <span className="font-semibold text-primary-900">
                  {(
                    Number(formData.montantCotisation) *
                    (Number(formData.membresMax) - 1)
                  ).toLocaleString("fr-FR")}{" "}
                  €
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center justify-center gap-2 flex-1 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Création...
              </>
            ) : (
              <>
                Créer la tontine
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
          <Link
            href="/tontines"
            className="btn-secondary text-center flex-1 flex items-center justify-center"
          >
            Annuler
          </Link>
        </div>
      </form>
      )}
    </div>
  );
}
