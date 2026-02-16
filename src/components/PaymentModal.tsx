"use client";

import { useState } from "react";
import { X, Building, CreditCard, Loader2, CheckCircle2 } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (methode: string) => void;
  tontineNom: string;
  montant: number;
  devise: string;
  beneficiaire: string;
}

const methodes = [
  { id: "carte", label: "Carte Bancaire", icon: CreditCard, desc: "Visa, Mastercard" },
  { id: "virement", label: "Virement Bancaire", icon: Building, desc: "Depuis votre compte bancaire" },
];

export default function PaymentModal({ isOpen, onClose, onConfirm, tontineNom, montant, devise, beneficiaire }: PaymentModalProps) {
  const [selected, setSelected] = useState("carte");
  const [step, setStep] = useState<"choose" | "confirm" | "processing" | "done">("choose");
  const [numero, setNumero] = useState("");

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setStep("processing");
    await new Promise((r) => setTimeout(r, 2000));
    onConfirm(selected);
    setStep("done");
    setTimeout(() => {
      setStep("choose");
      setNumero("");
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {step === "done" ? "Paiement effectué !" : "Payer ma cotisation"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {step === "done" ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Paiement confirmé !</h3>
              <p className="text-gray-500">
                Votre cotisation de {montant.toLocaleString("fr-FR")} {devise} a été enregistrée.
              </p>
            </div>
          ) : step === "processing" ? (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Traitement en cours...</p>
              <p className="text-sm text-gray-400 mt-1">Veuillez patienter</p>
            </div>
          ) : step === "confirm" ? (
            <div className="space-y-6">
              {/* Résumé */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tontine</span>
                  <span className="font-medium text-gray-900">{tontineNom}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Bénéficiaire du tour</span>
                  <span className="font-medium text-gray-900">{beneficiaire}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Méthode</span>
                  <span className="font-medium text-gray-900">{methodes.find((m) => m.id === selected)?.label}</span>
                </div>
                <hr />
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Montant</span>
                  <span className="text-xl font-bold text-primary-600">
                    {montant.toLocaleString("fr-FR")} {devise}
                  </span>
                </div>
              </div>

              {selected === "carte" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Numéro de carte
                  </label>
                  <input
                    type="text"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    className="input-field"
                    placeholder="4242 •••• •••• ••••"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep("choose")} className="btn-secondary flex-1">
                  Retour
                </button>
                <button onClick={handleConfirm} className="btn-primary flex-1">
                  Confirmer le paiement
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Info */}
              <div className="bg-primary-50 rounded-xl p-4 text-center">
                <p className="text-sm text-primary-600">Cotisation pour</p>
                <p className="font-bold text-primary-900 text-lg">{tontineNom}</p>
                <p className="text-2xl font-bold text-primary-600 mt-1">
                  {montant.toLocaleString("fr-FR")} {devise}
                </p>
              </div>

              {/* Méthodes */}
              <p className="text-sm font-medium text-gray-700">Choisir le mode de paiement :</p>
              <div className="space-y-2">
                {methodes.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelected(m.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                      selected === m.id
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      selected === m.id ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600"
                    }`}>
                      <m.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{m.label}</p>
                      <p className="text-xs text-gray-500">{m.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selected === m.id ? "border-primary-600" : "border-gray-300"
                    }`}>
                      {selected === m.id && <div className="w-3 h-3 bg-primary-600 rounded-full" />}
                    </div>
                  </button>
                ))}
              </div>

              <button onClick={() => setStep("confirm")} className="btn-primary w-full">
                Continuer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
