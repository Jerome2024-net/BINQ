"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTontine } from "@/contexts/TontineContext";
import { useFinance } from "@/contexts/FinanceContext";
import { useToast } from "@/contexts/ToastContext";
import SubscriptionModal from "@/components/SubscriptionModal";
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
} from "lucide-react";

export default function CreerTontinePage() {
  const router = useRouter();
  const { creerTontine } = useTontine();
  const { isAbonnementActif, souscrireAbonnement, getFraisConfig } = useFinance();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    montantCotisation: "",
    devise: "EUR",
    frequence: "mensuel",
    membresMax: "10",
    dateDebut: "",
    regles: "",
  });

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
      });

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
            <h3 className="font-bold text-primary-900 mb-3">
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
